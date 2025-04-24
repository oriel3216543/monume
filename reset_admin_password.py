import sqlite3

def reset_admin_password():
    try:
        # Connect to the database
        conn = sqlite3.connect('monume_tracker.db')
        cursor = conn.cursor()

        # Update the admin password
        new_password = 'ori3'
        cursor.execute("UPDATE users SET password = ? WHERE username = 'admin';", (new_password,))
        conn.commit()

        if cursor.rowcount > 0:
            print("Admin password reset successfully.")
        else:
            print("Admin user not found.")

        conn.close()
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    reset_admin_password()