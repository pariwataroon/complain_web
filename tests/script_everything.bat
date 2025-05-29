@echo off
echo ========================================
echo       MOF API Comprehensive Testing
echo ========================================

echo.
echo 1. Installing required packages...
pip install pytest requests pandas matplotlib seaborn openpyxl bcrypt PyJWT

echo.
echo 2. Creating test_reports directory...
if not exist "test_reports" mkdir test_reports

echo.
echo 3. Checking test files...
echo Looking for test files...
if exist "unit\test_auth_controller.py" (
    echo ✓ Found unit test file
) else (
    echo ✗ unit\test_auth_controller.py not found
)

if exist "integration\test_complete_api_pytest.py" (
    echo ✓ Found integration test file  
) else (
    echo ✗ integration\test_complete_api_pytest.py not found
)

echo.
echo 4. Running Unit Tests...
if exist "unit\test_auth_controller.py" (
    pytest unit\test_auth_controller.py -v --tb=short
) else (
    echo Skipping unit tests - file not found
)

echo.
echo 5. Running Integration Tests...
if exist "integration\test_complete_api_pytest.py" (
    pytest integration\test_complete_api_pytest.py -v --tb=short
) else (
    echo Skipping integration tests - file not found
)

echo.
echo 6. Generating Comprehensive Reports...
python test_report_generator.py

echo.
echo ========================================
echo       Testing Complete!
echo ========================================
echo Check the test_reports folder for all reports
echo.
echo Generated files:
echo - HTML Report: test_reports/test_report_*.html
echo - Excel Report: test_reports/comprehensive_test_report_*.xlsx
echo - Dashboard: test_reports/test_dashboard_*.png
echo - JSON Data: test_reports/combined_test_report_*.json
echo.
pause