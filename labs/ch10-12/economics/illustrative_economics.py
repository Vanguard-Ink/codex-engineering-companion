"""Reproduce Chapters 10–11 arithmetic; this is not an agent benchmark.

Run from any directory with Python 3.10 or later. The output labels fabricated
teaching inputs separately from the existing Northstar execution record.
No prices are fetched, and no external service or agent is invoked.
"""

import json
from decimal import Decimal
from pathlib import Path


def illustrative_calculations():
    rate_per_hour = Decimal("90")
    rate_per_minute = rate_per_hour / Decimal("60")
    human_minutes = Decimal("42")
    activities = {
        "specification": Decimal("5"),
        "supervision": Decimal("3"),
        "review": Decimal("12"),
        "recovery": Decimal("4"),
    }
    active_minutes = sum(activities.values())
    human_assigned_cost = human_minutes * rate_per_minute
    agent_assigned_cost = active_minutes * rate_per_minute + Decimal("8") + Decimal("2")
    additional_review_minutes = Decimal("12")
    revised_cost = agent_assigned_cost + additional_review_minutes * rate_per_minute
    setup_cost = Decimal("60") * rate_per_minute
    per_reuse_saving = Decimal("8") * rate_per_minute - Decimal("2")
    break_even_reuses = setup_cost / per_reuse_saving
    retry_threshold = Decimal("12") / Decimal("50")
    parallel_lead = 4 + max(18, 12) + 5 + 6
    serial_lead = 18 + 12 + 6
    parallel_stage_minutes = 4 + 18 + 12 + 5 + 6

    # These assertions catch unit/category and prose-transcription mistakes.
    assert active_minutes == 24
    assert human_assigned_cost == 63
    assert agent_assigned_cost == 46
    assert human_assigned_cost - agent_assigned_cost == 17
    assert revised_cost == 64 and revised_cost > human_assigned_cost
    assert active_minutes + 30 == 54
    assert human_minutes - active_minutes == 18
    assert setup_cost == 90 and per_reuse_saving == 10
    assert break_even_reuses == 9
    assert per_reuse_saving * 9 - setup_cost == 0
    assert per_reuse_saving * 10 - setup_cost > 0
    assert retry_threshold == Decimal("0.24")
    assert parallel_lead == 33 and serial_lead == 36
    assert parallel_stage_minutes == 45

    return {
        "status": "ILLUSTRATIVE_INPUTS_ONLY",
        "currency": "USD assigned for arithmetic; not current product pricing",
        "assigned_human_hourly_rate": str(rate_per_hour),
        "human_only_assigned_cost": str(human_assigned_cost),
        "delegated_assigned_cost": str(agent_assigned_cost),
        "assigned_saving": str(human_assigned_cost - agent_assigned_cost),
        "delegated_cost_with_12_extra_review_minutes": str(revised_cost),
        "human_active_minutes": str(human_minutes),
        "delegated_active_minutes": str(active_minutes),
        "delegated_elapsed_minutes_no_overlap_assumption": "54",
        "setup_assigned_cost": str(setup_cost),
        "per_reuse_assigned_saving": str(per_reuse_saving),
        "break_even_reuses": str(break_even_reuses),
        "first_positive_savings_reuse": 10,
        "retry_success_probability_threshold_not_estimate": str(retry_threshold),
        "parallel_schedule_elapsed_minutes": parallel_lead,
        "serial_schedule_elapsed_minutes": serial_lead,
        "parallel_schedule_aggregate_stage_minutes": parallel_stage_minutes,
    }


def historical_pilot():
    workspace = Path(__file__).resolve().parents[3]
    source = workspace / "evidence/historical/result.json"
    invocation_source = source.with_name("invocation.json")
    record = json.loads(source.read_text(encoding="utf-8-sig"))
    invocation = json.loads(invocation_source.read_text(encoding="utf-8-sig"))
    expected_usage = {
        "input_tokens": 404445,
        "cached_input_tokens": 368896,
        "cache_write_input_tokens": 0,
        "output_tokens": 4646,
        "reasoning_output_tokens": 688,
    }
    assert record["startedAt"].startswith("2026-09-06T")
    assert record["elapsedSeconds"] == 254.813
    assert record["trialCount"] == 1
    assert record["exitCode"] == 0
    assert record["usage"] == expected_usage
    for key in ("humanAttentionMinutes", "humanReviewCorrections", "dollarCost"):
        assert record[key] is None, f"Evidence changed: review manuscript {key}"
    return {
        "status": "OBSERVED_HISTORICAL_SINGLE_RUN",
        "source": str(source.relative_to(workspace)),
        "invocation_source": str(invocation_source.relative_to(workspace)),
        "elapsed_seconds": record["elapsedSeconds"],
        "trial_count": record["trialCount"],
        "process_exit_code": record["exitCode"],
        "reported_usage_unmodified": record["usage"],
        "human_attention_minutes": record["humanAttentionMinutes"],
        "human_review_corrections": record["humanReviewCorrections"],
        "dollar_cost": record["dollarCost"],
        "retained_configuration_boundary": invocation["config"],
        "limits": record["limits"],
        "comparative_ranking": "NOT_MEASURED",
        "correctness": "Consult independent acceptance evidence; exit code is insufficient",
    }


if __name__ == "__main__":
    print(json.dumps({
        "illustrative": illustrative_calculations(),
        "historical": historical_pilot(),
        "comparison_arms": {
            "human_only": "PROPOSED_NOT_MEASURED",
            "single_agent": "PROPOSED_NOT_MEASURED",
            "multi_agent": "PROPOSED_NOT_MEASURED",
            "agent_plus_reviewer": "PROPOSED_NOT_MEASURED",
            "agent_plus_automated_eval": "PROPOSED_NOT_MEASURED",
        },
    }, indent=2))
