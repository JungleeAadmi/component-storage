import string

def generate_tray_codes(partition_label: str, rows: int, cols: int):
    letters = string.ascii_uppercase

    result = []
    for r in range(rows):
        row_letter = letters[r]
        for c in range(1, cols + 1):
            code = f"{row_letter}{c}"
            if partition_label.upper() == "BIG":
                code = f"BIG-{code}"
            result.append(code)
    return result
