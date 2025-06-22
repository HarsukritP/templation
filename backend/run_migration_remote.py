#!/usr/bin/env python3
"""
Run migration remotely via API call to Railway deployment
"""

import requests
import os

def run_migration():
    """Run the marketplace migration on Railway"""
    
    # Railway backend URL
    backend_url = "https://templation-api.up.railway.app"
    
    try:
        print("🚀 Running marketplace migration on Railway...")
        
        # Call the debug endpoint to run SQL
        response = requests.post(f"{backend_url}/debug/run-sql", json={
            "sql": """
                -- Add is_public column to templates table
                ALTER TABLE templates 
                ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE NOT NULL;
                
                -- Add index for better performance on marketplace queries
                CREATE INDEX IF NOT EXISTS idx_templates_is_public 
                ON templates(is_public) WHERE is_public = TRUE;
                
                -- Add composite index for public templates with creation date
                CREATE INDEX IF NOT EXISTS idx_templates_public_created 
                ON templates(is_public, created_at DESC) WHERE is_public = TRUE;
            """
        })
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Migration completed successfully!")
            print(f"   Response: {result}")
        else:
            print(f"❌ Migration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error running migration: {str(e)}")

if __name__ == "__main__":
    run_migration() 