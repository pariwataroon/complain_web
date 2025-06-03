"""
CAPTS MOF API - Visual Report Generator
แปลงผลการทดสอบจากไฟล์ JSON เป็นรูปภาพและกราฟ
"""

import json
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
from collections import Counter
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.offline as pyo

# กำหนดธีมและสี
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

class VisualReportGenerator:
    """คลาสสำหรับสร้างรายงานภาพจากผลการทดสอบ API"""
    
    def __init__(self, json_report_path: str):
        """
        Args:
            json_report_path: เส้นทางไปยังไฟล์ JSON ที่มีผลการทดสอบ
        """
        self.report_path = Path(json_report_path)
        self.data = self._load_report()
        self.output_dir = Path("visual_reports")
        self.output_dir.mkdir(exist_ok=True)
        
    def _load_report(self) -> Dict[str, Any]:
        """โหลดข้อมูลจากไฟล์ JSON"""
        try:
            with open(self.report_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Report file not found: {self.report_path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {e}")
    
    def generate_all_reports(self):
        """สร้างรายงานภาพทั้งหมด"""
        print("🎨 กำลังสร้างรายงานภาพ...")
        
        # 1. ภาพรวมผลการทดสอบ
        self.create_summary_dashboard()
        
        # 2. กราฟแท่งผลการทดสอบแต่ละกลุ่ม
        self.create_test_groups_chart()
        
        # 3. กราฟวงกลมสถานะการทดสอบ
        self.create_status_pie_chart()
        
        # 4. กราฟเส้นประสิทธิภาพ (Response Time)
        self.create_performance_chart()
        
        # 5. ตารางสรุปข้อมูล
        self.create_detailed_table()
        
        # 6. Interactive HTML Dashboard
        self.create_interactive_dashboard()
        
        print(f"✅ รายงานภาพทั้งหมดถูกสร้างในโฟลเดอร์: {self.output_dir}")
        
    def create_summary_dashboard(self):
        """สร้างแดชบอร์ดสรุปผลการทดสอบ"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('CAPTS MOF API - Integration Test Summary Dashboard', 
                    fontsize=16, fontweight='bold')
        
        summary = self.data['summary']
        
        # FIXED: Handle missing 'skipped' field
        skipped = summary.get('skipped', 0)
        
        # 1. Donut Chart - Test Results
        sizes = [summary['passed'], summary['failed'], skipped]
        labels = ['Passed', 'Failed', 'Skipped']
        colors = ['#2ecc71', '#e74c3c', '#f39c12']
        
        # Remove zero values and their labels
        non_zero_data = [(size, label, color) for size, label, color in zip(sizes, labels, colors) if size > 0]
        if non_zero_data:
            sizes, labels, colors = zip(*non_zero_data)
        
        wedges, texts, autotexts = ax1.pie(sizes, labels=labels, colors=colors, 
                                        autopct='%1.1f%%', startangle=90,
                                        wedgeprops=dict(width=0.5))
        ax1.set_title('Test Results Distribution', fontweight='bold')
        
        # 2. Bar Chart - Metrics
        metrics = ['Total', 'Passed', 'Failed']
        values = [summary['total_tests'], summary['passed'], summary['failed']]
        if skipped > 0:
            metrics.append('Skipped')
            values.append(skipped)
            
        bars = ax2.bar(metrics, values, color=['#3498db', '#2ecc71', '#e74c3c', '#f39c12'][:len(values)])
        ax2.set_title('Test Metrics', fontweight='bold')
        ax2.set_ylabel('Count')
        
        # เพิ่มตัวเลขบนแท่ง
        for bar, value in zip(bars, values):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                    f'{value}', ha='center', va='bottom', fontweight='bold')
        
        # 3. Pass Rate Gauge
        pass_rate = summary['pass_rate']
        theta = np.linspace(0, np.pi, 100)
        r = 1
        
        ax3.plot(theta, r * np.ones_like(theta), 'k-', linewidth=2)
        ax3.fill_between(theta[:int(pass_rate)], 0, r, 
                        color='#2ecc71', alpha=0.7)
        ax3.fill_between(theta[int(pass_rate):], 0, r, 
                        color='#e74c3c', alpha=0.3)
        
        ax3.text(np.pi/2, 0.5, f'{pass_rate:.1f}%', 
                ha='center', va='center', fontsize=20, fontweight='bold')
        ax3.set_title('Pass Rate', fontweight='bold')
        ax3.set_xlim(0, np.pi)
        ax3.set_ylim(0, 1.2)
        ax3.axis('off')
        
        # 4. Timeline
        test_details = self.data['test_details']
        if test_details:
            timestamps = [datetime.fromisoformat(test['timestamp'].replace('Z', '+00:00')) 
                        for test in test_details[:10]]  # แสดง 10 รายการแรก
            durations = [test['duration'] for test in test_details[:10]]
            
            ax4.plot(range(len(timestamps)), durations, 'o-', color='#3498db', linewidth=2)
            ax4.set_title('Response Time Trend (First 10 Tests)', fontweight='bold')
            ax4.set_xlabel('Test Number')
            ax4.set_ylabel('Duration (seconds)')
            ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'summary_dashboard.png', 
                dpi=300, bbox_inches='tight')
        plt.close()

    def create_test_groups_chart(self):
        """สร้างกราฟแท่งผลการทดสอบแต่ละกลุ่ม"""
        test_details = self.data['test_details']
        
        if not test_details:
            print("⚠️ ไม่มีข้อมูลการทดสอบสำหรับสร้างกราฟกลุ่ม")
            return
        
        # จัดกลุ่มการทดสอบตามชื่อ class
        groups = {}
        for test in test_details:
            # แยกชื่อกลุ่มจากชื่อ test
            if '::' in test['name']:
                parts = test['name'].split('::')
                group_name = parts[1] if len(parts) > 1 else 'Other'
            else:
                group_name = 'Other'
            
            if group_name not in groups:
                groups[group_name] = {'passed': 0, 'failed': 0, 'skipped': 0, 'total': 0}
            
            groups[group_name]['total'] += 1
            if test['status'] == 'PASS':
                groups[group_name]['passed'] += 1
            elif test['status'] == 'FAIL':
                groups[group_name]['failed'] += 1
            else:
                groups[group_name]['skipped'] += 1
        
        # สร้างกราฟ
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
        fig.suptitle('Test Results by Groups', fontsize=16, fontweight='bold')
        
        group_names = list(groups.keys())
        passed_counts = [groups[name]['passed'] for name in group_names]
        failed_counts = [groups[name]['failed'] for name in group_names]
        skipped_counts = [groups[name]['skipped'] for name in group_names]
        
        # 1. Stacked Bar Chart
        x = range(len(group_names))
        width = 0.8
        
        ax1.bar(x, passed_counts, width, label='Passed', color='#2ecc71')
        ax1.bar(x, failed_counts, width, bottom=passed_counts, label='Failed', color='#e74c3c')
        
        # เพิ่ม skipped ถ้ามี
        if any(skipped_counts):
            bottom_values = [p + f for p, f in zip(passed_counts, failed_counts)]
            ax1.bar(x, skipped_counts, width, bottom=bottom_values, label='Skipped', color='#f39c12')
        
        ax1.set_xlabel('Test Groups')
        ax1.set_ylabel('Number of Tests')
        ax1.set_title('Test Results by Group (Stacked)', fontweight='bold')
        ax1.set_xticks(x)
        ax1.set_xticklabels(group_names, rotation=45, ha='right')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # 2. Pass Rate by Group
        pass_rates = [groups[name]['passed'] / groups[name]['total'] * 100 
                    if groups[name]['total'] > 0 else 0
                    for name in group_names]
        
        colors = ['#2ecc71' if rate == 100 else '#f39c12' if rate >= 80 else '#e74c3c' 
                for rate in pass_rates]
        
        bars = ax2.bar(x, pass_rates, color=colors, alpha=0.7)
        ax2.set_xlabel('Test Groups')
        ax2.set_ylabel('Pass Rate (%)')
        ax2.set_title('Pass Rate by Group', fontweight='bold')
        ax2.set_xticks(x)
        ax2.set_xticklabels(group_names, rotation=45, ha='right')
        ax2.set_ylim(0, 105)
        ax2.grid(True, alpha=0.3)
        
        # เพิ่มตัวเลขบนแท่ง
        for bar, rate in zip(bars, pass_rates):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 1,
                    f'{rate:.1f}%', ha='center', va='bottom', fontweight='bold')
        
        # เพิ่ม legend สำหรับสี
        from matplotlib.patches import Patch
        legend_elements = [
            Patch(facecolor='#2ecc71', label='100% Pass'),
            Patch(facecolor='#f39c12', label='80-99% Pass'),
            Patch(facecolor='#e74c3c', label='<80% Pass')
        ]
        ax2.legend(handles=legend_elements, loc='upper right')
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'test_groups_chart.png', 
                dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"📊 Test groups chart สร้างเสร็จแล้ว")

    def create_status_pie_chart(self):
        """สร้างกราฟวงกลมแสดงสถานะการทดสอบ"""
        summary = self.data['summary']
        
        # FIXED: Handle missing 'skipped' field - เก็บแค่ฟังก์ชันนี้
        skipped = summary.get('skipped', 0)
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('Test Status Analysis', fontsize=16, fontweight='bold')
        
        # 1. Pie Chart หลัก
        sizes = [summary['passed'], summary['failed'], skipped]
        labels = ['Passed', 'Failed', 'Skipped']
        colors = ['#2ecc71', '#e74c3c', '#f39c12']
        explode = (0.05, 0.05, 0.05)
        
        # Remove zero values and their labels
        non_zero_data = [(size, label, color, explode_val) for size, label, color, explode_val in zip(sizes, labels, colors, explode) if size > 0]
        if non_zero_data:
            sizes, labels, colors, explode = zip(*non_zero_data)
        
        wedges, texts, autotexts = ax1.pie(sizes, explode=explode, labels=labels, 
                                        colors=colors, autopct='%1.1f%%', 
                                        shadow=True, startangle=90)
        ax1.set_title('Overall Test Results', fontweight='bold')
        
        # 2. Donut Chart
        wedges2, texts2, autotexts2 = ax2.pie(sizes, labels=labels, colors=colors,
                                            autopct='%1.1f%%', startangle=90,
                                            wedgeprops=dict(width=0.5))
        
        # เพิ่มข้อความตรงกลาง
        centre_circle = plt.Circle((0,0), 0.30, fc='white')
        ax2.add_artist(centre_circle)
        ax2.text(0, 0, f"Total\n{summary['total_tests']}", 
                ha='center', va='center', fontsize=12, fontweight='bold')
        ax2.set_title('Test Distribution', fontweight='bold')
        
        # 3. Bar Chart แนวนอน
        categories = ['Passed', 'Failed']
        values = [summary['passed'], summary['failed']]
        colors_bar = ['#2ecc71', '#e74c3c']
        
        if skipped > 0:
            categories.append('Skipped')
            values.append(skipped)
            colors_bar.append('#f39c12')
        
        bars = ax3.barh(categories, values, color=colors_bar)
        ax3.set_title('Test Counts', fontweight='bold')
        ax3.set_xlabel('Number of Tests')
        
        # เพิ่มตัวเลข
        for bar, value in zip(bars, values):
            width = bar.get_width()
            ax3.text(width + 0.5, bar.get_y() + bar.get_height()/2,
                    f'{value}', ha='left', va='center', fontweight='bold')
        
        # 4. สถิติเพิ่มเติม
        ax4.axis('off')
        stats_text = f"""
        📊 Test Statistics:
        
        Total Tests: {summary['total_tests']}
        ✅ Passed: {summary['passed']} ({summary['passed']/summary['total_tests']*100:.1f}%)
        ❌ Failed: {summary['failed']} ({summary['failed']/summary['total_tests']*100:.1f}%)"""
        
        if skipped > 0:
            stats_text += f"\n    ⏭️ Skipped: {skipped} ({skipped/summary['total_tests']*100:.1f}%)"
        
        stats_text += f"""
        
        🎯 Pass Rate: {summary['pass_rate']:.1f}%
        
        📅 Test Date: {self.data['timestamp'][:10]}
        ⏰ Test Time: {self.data['timestamp'][11:19]}
        """
        
        ax4.text(0.1, 0.9, stats_text, transform=ax4.transAxes, 
                fontsize=11, verticalalignment='top',
                bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'status_pie_chart.png', 
                dpi=300, bbox_inches='tight')
        plt.close()

    def create_performance_chart(self):
        """สร้างกราฟประสิทธิภาพ (Response Time)"""
        test_details = self.data['test_details']
        
        if not test_details:
            print("⚠️ ไม่มีข้อมูลการทดสอบสำหรับสร้างกราฟประสิทธิภาพ")
            return
            
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('API Performance Analysis', fontsize=16, fontweight='bold')
        
        # เตรียมข้อมูล
        durations = [test['duration'] for test in test_details]
        test_names = [test['name'][:30] + '...' if len(test['name']) > 30 
                     else test['name'] for test in test_details]
        
        # 1. Response Time Timeline
        ax1.plot(range(len(durations)), durations, 'o-', color='#3498db', 
                linewidth=2, markersize=4)
        ax1.set_title('Response Time Timeline', fontweight='bold')
        ax1.set_xlabel('Test Number')
        ax1.set_ylabel('Duration (seconds)')
        ax1.grid(True, alpha=0.3)
        
        # เพิ่มเส้นค่าเฉลี่ย
        avg_duration = np.mean(durations)
        ax1.axhline(y=avg_duration, color='red', linestyle='--', 
                   label=f'Average: {avg_duration:.3f}s')
        ax1.legend()
        
        # 2. Histogram การกระจายของ Response Time
        ax2.hist(durations, bins=20, color='#e74c3c', alpha=0.7, edgecolor='black')
        ax2.set_title('Response Time Distribution', fontweight='bold')
        ax2.set_xlabel('Duration (seconds)')
        ax2.set_ylabel('Frequency')
        ax2.grid(True, alpha=0.3)
        
        # เพิ่มสถิติ
        stats_text = f"""
        Min: {min(durations):.3f}s
        Max: {max(durations):.3f}s
        Avg: {np.mean(durations):.3f}s
        Median: {np.median(durations):.3f}s
        """
        ax2.text(0.7, 0.7, stats_text, transform=ax2.transAxes,
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        # 3. Top 10 Slowest Tests
        sorted_tests = sorted(enumerate(test_details), 
                             key=lambda x: x[1]['duration'], reverse=True)[:10]
        
        slowest_names = [test_names[i] for i, _ in sorted_tests]
        slowest_durations = [test['duration'] for _, test in sorted_tests]
        
        bars = ax3.barh(range(len(slowest_names)), slowest_durations, 
                       color='#f39c12')
        ax3.set_title('Top 10 Slowest Tests', fontweight='bold')
        ax3.set_xlabel('Duration (seconds)')
        ax3.set_yticks(range(len(slowest_names)))
        ax3.set_yticklabels(slowest_names, fontsize=8)
        
        # เพิ่มตัวเลข
        for bar, duration in zip(bars, slowest_durations):
            width = bar.get_width()
            ax3.text(width + 0.001, bar.get_y() + bar.get_height()/2,
                    f'{duration:.3f}s', ha='left', va='center', fontsize=8)
        
        # 4. Box Plot สำหรับ HTTP Methods
        methods_data = {}
        for test in test_details:
            method = test['details'].get('method', 'Unknown')
            if method not in methods_data:
                methods_data[method] = []
            methods_data[method].append(test['duration'])
        
        if methods_data:
            methods = list(methods_data.keys())
            data_for_box = [methods_data[method] for method in methods]
            
            box_plot = ax4.boxplot(data_for_box, labels=methods, patch_artist=True)
            ax4.set_title('Response Time by HTTP Method', fontweight='bold')
            ax4.set_ylabel('Duration (seconds)')
            ax4.grid(True, alpha=0.3)
            
            # ระบายสี
            colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6']
            for patch, color in zip(box_plot['boxes'], colors[:len(box_plot['boxes'])]):
                patch.set_facecolor(color)
                patch.set_alpha(0.7)
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'performance_chart.png', 
                   dpi=300, bbox_inches='tight')
        plt.close()
        
    def create_detailed_table(self):
        """สร้างตารางสรุปรายละเอียด"""
        test_details = self.data['test_details']
        
        if not test_details:
            print("⚠️ ไม่มีข้อมูลการทดสอบสำหรับสร้างตาราง")
            return
            
        # เตรียมข้อมูลสำหรับตาราง
        table_data = []
        for i, test in enumerate(test_details, 1):
            table_data.append([
                i,
                test['name'][:50] + '...' if len(test['name']) > 50 else test['name'],
                test['details'].get('method', 'N/A'),
                test['details'].get('endpoint', 'N/A')[:40] + '...' if len(test['details'].get('endpoint', '')) > 40 else test['details'].get('endpoint', 'N/A'),
                test['status'],
                f"{test['duration']:.3f}s",
                test['details'].get('status_code', 'N/A')
            ])
        
        # สร้างตาราง
        fig, ax = plt.subplots(figsize=(16, max(8, len(table_data) * 0.3)))
        ax.axis('tight')
        ax.axis('off')
        
        headers = ['#', 'Test Name', 'Method', 'Endpoint', 'Status', 'Duration', 'HTTP Code']
        
        # สร้างตาราง
        table = ax.table(cellText=table_data, colLabels=headers, 
                        cellLoc='left', loc='center')
        
        # ปรับแต่งตาราง
        table.auto_set_font_size(False)
        table.set_fontsize(8)
        table.scale(1.2, 1.5)
        
        # ระบายสีแถวสลับ
        for i in range(len(table_data)):
            for j in range(len(headers)):
                cell = table[(i+1, j)]
                if i % 2 == 0:
                    cell.set_facecolor('#f8f9fa')
                else:
                    cell.set_facecolor('#ffffff')
                
                # ระบายสีตามสถานะ
                if j == 4:  # Status column
                    if table_data[i][4] == 'PASS':
                        cell.set_facecolor('#d4edda')
                    elif table_data[i][4] == 'FAIL':
                        cell.set_facecolor('#f8d7da')
                    elif table_data[i][4] == 'SKIP':
                        cell.set_facecolor('#fff3cd')
        
        # ระบายสีหัวตาราง
        for j in range(len(headers)):
            cell = table[(0, j)]
            cell.set_facecolor('#007bff')
            cell.set_text_props(weight='bold', color='white')
        
        plt.title('Detailed Test Results Table', fontsize=16, fontweight='bold', pad=20)
        plt.savefig(self.output_dir / 'detailed_table.png', 
                   dpi=300, bbox_inches='tight')
        plt.close()
        
    def create_interactive_dashboard(self):
        """สร้าง Interactive HTML Dashboard"""
        test_details = self.data['test_details']
        summary = self.data['summary']
        
        # FIXED: Handle missing 'skipped' field
        skipped = summary.get('skipped', 0)
        
        # สร้าง subplot
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=('Test Results Overview', 'Response Time Trend',
                        'Status Distribution', 'Performance by Method',
                        'Top Slow Tests', 'Test Timeline'),
            specs=[[{"type": "bar"}, {"type": "scatter"}],
                [{"type": "pie"}, {"type": "box"}],
                [{"type": "bar"}, {"type": "scatter"}]]
        )
        
        # 1. Test Results Overview
        categories = ['Total', 'Passed', 'Failed']
        values = [summary['total_tests'], summary['passed'], summary['failed']]
        colors = ['#3498db', '#2ecc71', '#e74c3c']
        
        if skipped > 0:
            categories.append('Skipped')
            values.append(skipped)
            colors.append('#f39c12')
        
        fig.add_trace(
            go.Bar(
                x=categories,
                y=values,
                marker_color=colors,
                name='Test Counts'
            ),
            row=1, col=1
        )
        
        # 2. Response Time Trend
        durations = [test['duration'] for test in test_details]
        fig.add_trace(
            go.Scatter(
                x=list(range(len(durations))),
                y=durations,
                mode='lines+markers',
                name='Response Time',
                line=dict(color='#3498db', width=2)
            ),
            row=1, col=2
        )
        
        # 3. Status Distribution
        pie_labels = ['Passed', 'Failed']
        pie_values = [summary['passed'], summary['failed']]
        pie_colors = ['#2ecc71', '#e74c3c']
        
        if skipped > 0:
            pie_labels.append('Skipped')
            pie_values.append(skipped)
            pie_colors.append('#f39c12')
        
        fig.add_trace(
            go.Pie(
                labels=pie_labels,
                values=pie_values,
                marker_colors=pie_colors,
                name='Status'
            ),
            row=2, col=1
        )
        
        # 4. Performance by Method
        methods_data = {}
        for test in test_details:
            method = test['details'].get('method', 'Unknown')
            if method not in methods_data:
                methods_data[method] = []
            methods_data[method].append(test['duration'])
        
        for method, durations in methods_data.items():
            fig.add_trace(
                go.Box(
                    y=durations,
                    name=method,
                    boxpoints='outliers'
                ),
                row=2, col=2
            )
        
        # 5. Top 10 Slowest Tests
        sorted_tests = sorted(test_details, key=lambda x: x['duration'], reverse=True)[:10]
        slow_names = [test['name'][:30] + '...' if len(test['name']) > 30 
                    else test['name'] for test in sorted_tests]
        slow_durations = [test['duration'] for test in sorted_tests]
        
        fig.add_trace(
            go.Bar(
                x=slow_durations,
                y=slow_names,
                orientation='h',
                marker_color='#f39c12',
                name='Slow Tests'
            ),
            row=3, col=1
        )
        
        # 6. Test Timeline
        timestamps = [datetime.fromisoformat(test['timestamp'].replace('Z', '+00:00')) 
                    for test in test_details]
        statuses = [test['status'] for test in test_details]
        
        # แยกตามสถานะ
        pass_times = [ts for ts, status in zip(timestamps, statuses) if status == 'PASS']
        fail_times = [ts for ts, status in zip(timestamps, statuses) if status == 'FAIL']
        
        if pass_times:
            fig.add_trace(
                go.Scatter(
                    x=pass_times,
                    y=[1] * len(pass_times),
                    mode='markers',
                    marker=dict(color='#2ecc71', size=8),
                    name='Passed Tests'
                ),
                row=3, col=2
            )
        
        if fail_times:
            fig.add_trace(
                go.Scatter(
                    x=fail_times,
                    y=[0] * len(fail_times),
                    mode='markers',
                    marker=dict(color='#e74c3c', size=8),
                    name='Failed Tests'
                ),
                row=3, col=2
            )
        
        # อัพเดต layout
        fig.update_layout(
            height=1200,
            title_text=f"CAPTS MOF API - Interactive Test Dashboard<br>Pass Rate: {summary['pass_rate']:.1f}%",
            title_x=0.5,
            showlegend=True
        )
        
        # บันทึกเป็น HTML
        html_path = self.output_dir / 'interactive_dashboard.html'
        pyo.plot(fig, filename=str(html_path), auto_open=False)
        
        print(f"📊 Interactive dashboard สร้างเสร็จแล้ว: {html_path}")


def main():
    """ฟังก์ชันหลักสำหรับทดสอบการทำงาน"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python visual_report_generator.py <json_report_path>")
        print("Example: python visual_report_generator.py test_reports/integration_test_report_20241212_143022.json")
        return
    
    json_report_path = sys.argv[1]
    
    try:
        generator = VisualReportGenerator(json_report_path)
        generator.generate_all_reports()
        print("\n🎉 รายงานภาพทั้งหมดสร้างเสร็จสมบูรณ์!")
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")


if __name__ == "__main__":
    main()
