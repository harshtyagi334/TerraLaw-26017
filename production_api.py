"""Production API foundation for the land-acquisition platform.

Uses PostgreSQL/PostGIS when DATABASE_URL is configured and SQLite for local smoke tests.
This service is additive: the existing demo model server and Vite UI remain compatible.
"""
import asyncio
import hashlib
import json
import os
import secrets
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

import bcrypt
import jwt
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship
from websockets.asyncio.server import serve

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./land_acquisition_local.db')
JWT_SECRET = os.getenv('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALGORITHM = 'HS256'
engine = create_engine(DATABASE_URL, future=True)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    role: Mapped[str] = mapped_column(String(64))
    state: Mapped[str | None] = mapped_column(String(128), nullable=True)
    district: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ProjectRecord(Base):
    __tablename__ = 'projects'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    state: Mapped[str] = mapped_column(String(128), index=True)
    district: Mapped[str] = mapped_column(String(128), index=True)
    payload: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AuditRecord(Base):
    __tablename__ = 'audit_logs'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    action: Mapped[str] = mapped_column(String(64))
    entity_type: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str] = mapped_column(String(128))
    details: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AlertRecord(Base):
    __tablename__ = 'alerts'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    project_id: Mapped[str] = mapped_column(String(64), index=True)
    severity: Mapped[str] = mapped_column(String(32))
    payload: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


Base.metadata.create_all(engine)


def issue_token(user: User) -> str:
    return jwt.encode(
        {'sub': user.id, 'role': user.role, 'exp': datetime.now(timezone.utc) + timedelta(hours=8)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def authenticate(headers):
    value = headers.get('Authorization', '')
    if not value.startswith('Bearer '):
        return None
    try:
        claims = jwt.decode(value[7:], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    with Session(engine) as session:
        return session.get(User, claims['sub'])


def json_body(handler):
    length = int(handler.headers.get('Content-Length', '0'))
    return json.loads(handler.rfile.read(length) or b'{}')


class ApiHandler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, default=str).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', os.getenv('CORS_ORIGIN', 'http://localhost:3000'))
        self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(204, {})

    def do_POST(self):
        route = urlparse(self.path).path
        payload = json_body(self)
        if route == '/api/auth/register':
            email = payload.get('email', '').strip().lower()
            password = payload.get('password', '')
            if len(password) < 12 or '@' not in email:
                self.send_json(400, {'error': 'A valid email and 12-character password are required'})
                return
            with Session(engine) as session:
                if session.scalar(select(User).where(User.email == email)):
                    self.send_json(409, {'error': 'User already exists'})
                    return
                user = User(
                    id=f'USR-{secrets.token_hex(8)}',
                    email=email,
                    password_hash=bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
                    role=payload.get('role', 'Project Officer'),
                    state=payload.get('state'),
                    district=payload.get('district'),
                )
                session.add(user)
                session.commit()
                self.send_json(201, {'token': issue_token(user), 'user_id': user.id, 'role': user.role})
            return
        if route == '/api/auth/login':
            with Session(engine) as session:
                user = session.scalar(select(User).where(User.email == payload.get('email', '').strip().lower()))
                valid = user and bcrypt.checkpw(payload.get('password', '').encode(), user.password_hash.encode())
                if not valid:
                    self.send_json(401, {'error': 'Invalid credentials'})
                    return
                self.send_json(200, {'token': issue_token(user), 'user_id': user.id, 'role': user.role})
            return
        user = authenticate(self.headers)
        if not user:
            self.send_json(401, {'error': 'Authentication required'})
            return
        if route == '/api/projects':
            record = ProjectRecord(
                id=payload.get('project_id', f'PRJ-{secrets.token_hex(6)}'),
                state=payload.get('state', 'Unknown'),
                district=payload.get('district', 'Unknown'),
                payload=json.dumps(payload),
            )
            with Session(engine) as session:
                session.merge(record)
                session.add(AuditRecord(user_id=user.id, action='CREATE', entity_type='Project', entity_id=record.id, details='Project persisted'))
                session.commit()
            self.send_json(201, {'project_id': record.id, 'persisted': True})
            return
        self.send_json(404, {'error': 'Not found'})

    def do_GET(self):
        route = urlparse(self.path).path
        user = authenticate(self.headers)
        if route == '/api/health':
            self.send_json(200, {'status': 'ok', 'database': DATABASE_URL.split(':', 1)[0], 'timestamp': datetime.now(timezone.utc).isoformat()})
            return
        if not user:
            self.send_json(401, {'error': 'Authentication required'})
            return
        if route == '/api/projects':
            with Session(engine) as session:
                records = session.scalars(select(ProjectRecord)).all()
            self.send_json(200, {'projects': [json.loads(record.payload) for record in records]})
            return
        self.send_json(404, {'error': 'Not found'})

    def log_message(self, format, *args):
        return


async def websocket_handler(websocket):
    await websocket.send(json.dumps({'type': 'connected', 'message': 'Realtime event channel ready'}))
    async for message in websocket:
        await websocket.send(json.dumps({'type': 'ack', 'received': message, 'timestamp': datetime.now(timezone.utc).isoformat()}))


def start_websocket():
    async def run():
        async with serve(websocket_handler, '0.0.0.0', int(os.getenv('WS_PORT', '8765'))):
            await asyncio.Future()
    asyncio.run(run())


if __name__ == '__main__':
    threading.Thread(target=start_websocket, daemon=True).start()
    port = int(os.getenv('API_PORT', '8100'))
    print(f'Production API listening on http://localhost:{port}; WebSocket on ws://localhost:{os.getenv("WS_PORT", "8765")}')
    ThreadingHTTPServer(('0.0.0.0', port), ApiHandler).serve_forever()
