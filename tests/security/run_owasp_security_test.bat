@echo off
echo ========================================
echo    OWASP Top 10 Security Testing
echo ========================================

echo.
echo 1. Installing required packages...
pip install requests python-docx matplotlib seaborn pandas openpyxl

echo.
echo 2. Creating security test reports directory...
if not exist "test_reports" mkdir test_reports

echo.
echo 3. Running OWASP Top 10 Security Tests...
python owasp_top10_tester.py

echo.
echo 4. Generating comprehensive reports...
python owasp_doc_generator.py

echo.
echo ========================================
echo    OWASP Security Testing Complete!
echo ========================================
echo.
echo Check the test_reports folder for:
echo - Word Document (.docx)
echo - Excel Report (.xlsx) 
echo - Security Charts (.png)
echo - JSON Data (.json)
echo.
pause