from dataclasses import dataclass, field
from typing import Optional, List, Dict


@dataclass
class WorkerState:
    status: str = "idle"  # "idle" | "running" | "stopping"
    cycle_started_at: Optional[str] = None
    cycle_completed_at: Optional[str] = None
    next_cycle_at: Optional[str] = None
    total_newsletters: int = 0
    processed_count: int = 0
    current_newsletter_topic: Optional[str] = None
    current_step: Optional[str] = None  # "checking" | "searching" | "persisting" | "emailing"
    cycle_log: List[Dict] = field(default_factory=list)
    should_stop: bool = False
    manual_trigger: bool = False


worker_state = WorkerState()
