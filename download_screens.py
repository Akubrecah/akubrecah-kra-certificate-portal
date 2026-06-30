import urllib.request

screens_to_download = {
    'income.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzhlMzZmZGQ0M2I0MjQyYjA4MTExZjZjM2UzNDE3MDdiEgsSBxDiv4e_oxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjc1MDQ0MTMzMDIxMzM2ODEwNg&filename=&opi=89354086',
    'deductions.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRhMWRkMTFiNWRjMDQ0MzdiOTVlYzVkMDRjMGQxOTkzEgsSBxDiv4e_oxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjc1MDQ0MTMzMDIxMzM2ODEwNg&filename=&opi=89354086',
    'summary.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzcxZjNlMzBkYTE1MDQyODM5Zjc0ZDUyNzIxZmNlN2E5EgsSBxDiv4e_oxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjc1MDQ0MTMzMDIxMzM2ODEwNg&filename=&opi=89354086',
    'admin_dashboard.html': 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk2Y2Q0MGJkMGVmNDRjODZiNWJkZWFhMDM5NDhhOWMyEgsSBxDiv4e_oxYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjc1MDQ0MTMzMDIxMzM2ODEwNg&filename=&opi=96797242'
}

for filename, url in screens_to_download.items():
    print(f"Downloading {filename}...")
    urllib.request.urlretrieve(url, filename)
    print(f"Downloaded {filename}")
