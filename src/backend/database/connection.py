import os
import mysql.connector
from mysql.connector import MySQLConnection
from dotenv import load_dotenv

load_dotenv()


def get_connection() -> MySQLConnection:
    return mysql.connector.connect(
        host="localhost",
        user=os.getenv("DB_ADMIN_ID"),
        password=os.getenv("DB_ADMIN_PW"),
        database="gomgomai",
        use_pure=True
    )