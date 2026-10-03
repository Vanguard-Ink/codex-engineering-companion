# Delegation economics worksheet — filled example

Status: ILLUSTRATIVE_INPUTS_ONLY, not a measured saving or price quote.
Assigned hourly labor value: USD 90 = USD 1.50/minute.
Human-only assigned active time: 42 min => USD 63.
Delegated assigned active time: specification 5 + supervision 3 + review 12 + recovery 4 = 24 min => USD 36; assigned machine/tool cost 8 + 2 => total USD 46.
Assigned difference: 63 - 46 = USD 17. Twelve extra review minutes add USD 18, changing delegated total to USD 64.
Reuse case: assigned setup 60 min => USD 90. Assigned saving per reuse 8 min * 1.50 - 2 = USD 10. Nine reuses break even; ten first produce positive net assigned savings.
Run: python labs/ch10-12/economics/illustrative_economics.py.
Historical run: 254.813 seconds and reported tokens are from one separate record; human attention, corrections and dollar cost remain null.
Decision: measure real review/recovery time before making an economic claim. None of these assigned numbers estimate a reader's actual saving.
