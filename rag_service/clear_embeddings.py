"""
Clear embedding column data in the `incidents` table.

Usage:
  # Dry-run (shows count)
  python clear_embeddings.py

  # Actually clear with confirmation prompt
  python clear_embeddings.py

  # Force clear without prompt
  python clear_embeddings.py --yes

Optional flags:
  --table TABLE     Table name (default: incidents)
  --column COLUMN   Column name (default: embedding)

Requires:
  pip install psycopg2-binary python-dotenv

This script reads DB connection info from environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
If you have a `.env` in the project, python-dotenv will load it.
"""

import os
import argparse
from dotenv import load_dotenv
import sys

# Load .env from repo root (if present)
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    # fallback: load from current working directory
    load_dotenv()

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Missing dependency: install with `pip install psycopg2-binary python-dotenv`")
    sys.exit(2)


def get_conn():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )


def column_exists(conn, table: str, column: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_name = %s AND column_name = %s
            """,
            (table, column)
        )
        return cur.fetchone() is not None


def count_non_null(conn, table: str, column: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table} WHERE {column} IS NOT NULL")
        return cur.fetchone()[0]


def clear_column(conn, table: str, column: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {table} SET {column} = NULL WHERE {column} IS NOT NULL")
        return cur.rowcount


def parse_args():
    p = argparse.ArgumentParser(description="Clear embedding column in a table")
    p.add_argument('--table', default='incidents', help='Table name (default: incidents)')
    p.add_argument('--column', default='embedding', help='Column name (default: embedding)')
    p.add_argument('--yes', action='store_true', help='Do not prompt; proceed immediately')
    return p.parse_args()


def main():
    args = parse_args()
    table = args.table
    column = args.column

    try:
        conn = get_conn()
    except Exception as e:
        print(f"Failed to connect to DB: {e}")
        sys.exit(3)

    try:
        if not column_exists(conn, table, column):
            print(f"Column '{column}' does not exist in table '{table}'. Nothing to do.")
            return

        cnt = count_non_null(conn, table, column)
        print(f"Found {cnt} row(s) in `{table}` with non-null `{column}`.")

        if cnt == 0:
            print("No data to clear.")
            return

        if not args.yes:
            resp = input("Proceed to clear these values? Type 'yes' to continue: ")
            if resp.strip().lower() != 'yes':
                print("Aborted by user.")
                return

        # Perform update in transaction
        with conn:
            affected = clear_column(conn, table, column)
        print(f"Cleared `{column}` in `{table}`. Rows affected: {affected}")

    finally:
        conn.close()


if __name__ == '__main__':
    main()
