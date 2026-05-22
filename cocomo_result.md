COCOMO II Estimate (Actual Model Output)

Assumptions
- Size: 4.2 KSLOC (4,200 LOC)
- Nominal scale factors: PREC=3.72, FLEX=3.04, RESL=4.24, TEAM=3.29, PMAT=4.68
- Nominal effort multipliers: EAF = 1.0
- COCOMO II constants: A=2.94, B=0.91+0.01*sum(SF), TDEV=3.67*E^0.28

Calculations
- B = 0.91 + 0.01*18.97 = 1.0997
- Effort (E) = 2.94 * 4.2^1.0997 = 14.25 person-months
- Schedule (TDEV) = 3.67 * 14.25^0.28 = 7.72 months
- Avg team size (N) = E / TDEV = 1.85 developers
- Cost (@ INR 50,000 per PM) = INR 712,368
- Productivity = ~295 LOC/PM