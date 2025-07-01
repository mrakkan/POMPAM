import sqlite3

DB_PATH = "ดาต้าเบสมืง.db"

def get_all_data():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT บลาๆ FROM บลาๆ")
        return cursor.fetchall()
