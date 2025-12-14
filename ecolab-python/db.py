import os
from contextlib import contextmanager
from typing import Any, Iterable, Optional

import psycopg
from psycopg.rows import dict_row


def _dsn() -> str:
  url = os.environ.get("DATABASE_URL")
  if not url:
    raise RuntimeError("DATABASE_URL is not set for Python service")
  return url


@contextmanager
def get_conn():
  conn = psycopg.connect(_dsn(), row_factory=dict_row)
  try:
    yield conn
  finally:
    conn.close()


def fetch_all(query: str, params: Optional[Iterable[Any]] = None):
  with get_conn() as conn, conn.cursor() as cur:
    cur.execute(query, params or ())
    return cur.fetchall()


def fetch_one(query: str, params: Optional[Iterable[Any]] = None):
  with get_conn() as conn, conn.cursor() as cur:
    cur.execute(query, params or ())
    return cur.fetchone()
