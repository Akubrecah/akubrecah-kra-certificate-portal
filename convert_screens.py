import re
import os

def convert_html_to_jsx(filename, out_path, component_name):
    if not os.path.exists(filename):
        print(f"Skipping {filename} - not found")
        return
    with open(filename, 'r') as f:
        html = f.read()

    main_match = re.search(r'<main[^>]*>(.*?)</main>', html, re.DOTALL)
    if main_match:
        content = main_match.group(1)
    else:
        content_match = re.search(r'(<div class="[^"]*flex-1[^"]*".*?<!-- Content area -->.*?</div>\s*</div>)', html, re.DOTALL)
        if content_match:
            content = content_match.group(1)
        else:
            body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
            content = body_match.group(1) if body_match else html

    jsx = content.replace('class="', 'className="')
    jsx = re.sub(r'<(img|input|br|hr)([^>]*)(?<!/)>', r'<\1\2 />', jsx)
    jsx = jsx.replace('checked ', 'defaultChecked ')
    jsx = jsx.replace('selected ', 'defaultSelected ')
    jsx = jsx.replace('disabled ', 'disabled ')
    jsx = re.sub(r'style="([^"]*)"', r'style={{}}', jsx)
    jsx = jsx.replace('for="', 'htmlFor="')
    jsx = jsx.replace('<!--', '{/*')
    jsx = jsx.replace('-->', '*/}')
    
    component = f"""
export default function {component_name}() {{
  return (
    <>
      {jsx}
    </>
  );
}}
"""
    with open(out_path, 'w') as f:
        f.write(component)
    print(f"Generated {out_path}")

convert_html_to_jsx('income.html', 'app/dashboard/filing/income/page.tsx', 'IncomeDeclaration')
convert_html_to_jsx('deductions.html', 'app/dashboard/filing/deductions/page.tsx', 'DeductionsAndReliefs')
convert_html_to_jsx('summary.html', 'app/dashboard/filing/summary/page.tsx', 'ComputationSummary')
convert_html_to_jsx('admin_dashboard.html', 'app/admin/dashboard/page.tsx', 'OperatorDashboard')
