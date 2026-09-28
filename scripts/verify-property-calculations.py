#!/usr/bin/env python3
"""Independent reconciliation for the verified DNR Solace raw snapshot.

This intentionally does not import application code. It uses Decimal arithmetic,
round-half-up display precision, and the raw values extracted before V3 work.
"""
from decimal import Decimal, ROUND_HALF_UP, getcontext
from datetime import date
import calendar

getcontext().prec = 40
D = Decimal
CENT = D("0.01")

def money(value):
    return D(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)

installments = [
    (D("757500"), True, D("757500"), D("0")),
    (D("757500"), True, D("757500"), D("0")),
    (D("2272500"), True, D("250000"), D("2022500")),
    (D("1515000"), True, D("1515000"), D("0")),
    (D("1500000"), True, D("1500000"), D("0")),
    (D("935000"), False, D("0"), D("0")),
    (D("772500"), False, D("0"), D("0")),
]
principal = D("2022500")
annual_rate = D("8.5")
tenure = 120
prepayments = {
    date(2026, 4, 8): D("600000"),
    date(2026, 7, 3): D("790318"),
    date(2026, 7, 20): D("376112"),
}

monthly_rate = annual_rate / D("1200")
growth = (D("1") + monthly_rate) ** tenure
emi = money(principal * monthly_rate * growth / (growth - D("1")))

def schedule(with_prepayments):
    balance = principal
    rows = []
    for month in range(1, 601):
        if balance <= D("0.50"):
            break
        year = 2025 + (month - 1) // 12
        month_number = (month - 1) % 12 + 1
        day = min(31, calendar.monthrange(year, month_number)[1])
        current_date = date(year, month_number, day)
        prepaid = sum((amount for paid_date, amount in prepayments.items()
                       if with_prepayments and paid_date.year == year
                       and paid_date.month == month_number), D("0"))
        balance = max(D("0"), balance - prepaid)
        if balance <= D("0.50"):
            rows.append((current_date, D("0"), D("0"), D("0"), balance))
            break
        interest = money(balance * monthly_rate)
        principal_part = min(emi - interest, balance)
        balance = max(D("0"), balance - principal_part)
        rows.append((current_date, money(interest + principal_part), interest,
                     money(principal_part), money(balance)))
    return rows

base = schedule(False)
actual = schedule(True)
total_cost = sum((row[0] for row in installments), D("0"))
paid_cost = sum((row[0] for row in installments if row[1]), D("0"))
pending_cost = total_cost - paid_cost
self_paid = sum((row[2] for row in installments), D("0"))
bank_paid = sum((row[3] for row in installments), D("0"))
base_interest = sum((row[2] for row in base), D("0"))
actual_interest = sum((row[2] for row in actual), D("0"))
prepaid_total = sum(prepayments.values(), D("0"))
emi_principal = sum((row[3] for row in actual), D("0"))

checks = {
    "installments sum to total cost": total_cost == D("8510000"),
    "paid plus pending equals total": paid_cost + pending_cost == total_cost,
    "self plus bank equals paid": self_paid + bank_paid == paid_cost,
    "principal plus prepayments equals principal": emi_principal + prepaid_total == principal,
    "actual loan closes at zero": actual[-1][4] == D("0.00"),
    "actual schedule closes in 20 periods": len(actual) == 20,
    "interest savings matches baseline minus actual": money(base_interest - actual_interest) == D("753349.30"),
}

print("metric|value")
print(f"total_cost|{money(total_cost)}")
print(f"paid_cost|{money(paid_cost)}")
print(f"pending_cost|{money(pending_cost)}")
print(f"paid_percent|{(paid_cost / total_cost * 100).quantize(D('0.01'), rounding=ROUND_HALF_UP)}%")
print(f"self_paid|{money(self_paid)}")
print(f"bank_paid|{money(bank_paid)}")
print(f"emi|{emi}")
print(f"baseline_interest|{money(base_interest)}")
print(f"actual_interest|{money(actual_interest)}")
print(f"interest_saved|{money(base_interest - actual_interest)}")
print(f"prepaid_total|{money(prepaid_total)}")
print(f"own_money_out|{money(self_paid + principal + actual_interest)}")
print(f"projected_all_in|{money(total_cost + actual_interest)}")
print("check|result")
for name, passed in checks.items():
    print(f"{name}|{'PASS' if passed else 'FAIL'}")

if not all(checks.values()):
    raise SystemExit(1)
