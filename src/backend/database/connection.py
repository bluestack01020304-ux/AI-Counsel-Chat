import os
import psycopg
from dotenv import load_dotenv

load_dotenv()


def get_connection() -> psycopg.Connection:
    # Supabase transaction pooler(6543)는 prepared statement를 지원하지 않음
    return psycopg.connect(
        os.getenv("DATABASE_URL"),
        prepare_threshold=None
    )
