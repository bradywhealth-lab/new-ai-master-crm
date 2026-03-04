#!/bin/bash

# Phase 5 Database Migration Script
# This script helps you migrate your Supabase database to Phase 5
#
# Instructions:
# 1. Make sure you have Supabase CLI installed: npm install -g supabase
# 2. Or run the SQL manually in your Supabase dashboard

echo "==========================================="
echo "Phase 5 Database Migration Instructions"
echo "==========================================="
echo ""
echo "Option 1: Run SQL manually (Recommended)"
echo "  1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new"
echo "  2. Copy contents of docs/phase5-enhancements-database.sql"
echo "  3. Paste and run the SQL"
echo ""
echo "Option 2: Use Supabase CLI (if installed)"
echo "  1. Run: cat docs/phase5-enhancements-database.sql | supabase db execute"
echo ""
echo "==========================================="
echo "SQL File: docs/phase5-enhancements-database.sql"
echo "==========================================="
