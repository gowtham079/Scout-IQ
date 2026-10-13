from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TeamStandingItem(BaseModel):
    team_id: int
    season_id: int
    team_name: str
    rank: int
    matches: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    average_possession: Optional[float] = None
    corners: Optional[float] = None
    yellowcards: Optional[float] = None
    redcards: Optional[float] = None


class TeamDetail(BaseModel):
    team: TeamStandingItem
    squad_size: int
    squad_average_rating: Optional[float] = None
    top_scorers: List[Dict[str, Any]]
    key_playmakers: List[Dict[str, Any]]
