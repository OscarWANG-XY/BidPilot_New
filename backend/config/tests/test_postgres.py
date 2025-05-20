import psycopg2
import unittest
from django.conf import settings
from django.db import connections
from django.test import TestCase


class PostgresConnectionTest(TestCase):
    """Test PostgreSQL database connection."""
    
    def test_can_connect_to_db(self):
        """Test that Django can connect to the configured PostgreSQL database."""
        try:
            # Get a cursor from the default connection
            cursor = connections['default'].cursor()
            # Execute a simple query
            cursor.execute("SELECT 1")
            result = cursor.fetchone()[0]
            self.assertEqual(result, 1)
        except Exception as e:
            self.fail(f"Database connection failed: {e}")
    
    def test_direct_connection(self):
        """Test direct connection to PostgreSQL using psycopg2."""
        db_settings = settings.DATABASES['default']
        try:
            # Connect directly using psycopg2
            conn = psycopg2.connect(
                dbname=db_settings['NAME'],
                user=db_settings['USER'],
                password=db_settings['PASSWORD'],
                host=db_settings['HOST'],
                port=db_settings['PORT']
            )
            # Create a cursor
            cur = conn.cursor()
            # Execute a simple query
            cur.execute("SELECT version();")
            # Get the result
            version = cur.fetchone()
            # Close the cursor and connection
            cur.close()
            conn.close()
            # Check that we got a result
            self.assertIsNotNone(version)
            print(f"PostgreSQL version: {version[0]}")
        except Exception as e:
            self.fail(f"Direct connection to PostgreSQL failed: {e}")


if __name__ == '__main__':
    unittest.main()
