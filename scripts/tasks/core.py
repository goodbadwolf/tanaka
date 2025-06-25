from dataclasses import dataclass


@dataclass
class TaskResult:
    success: bool
    message: str
    exit_code: int = 0

    def __post_init__(self):
        # Auto-set exit_code based on success if not provided
        if self.exit_code == 0 and not self.success:
            self.exit_code = 1

    def __bool__(self) -> bool:
        return self.success
