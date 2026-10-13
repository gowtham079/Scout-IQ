from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PlayerScoutingItem(BaseModel):
    player_id: int
    player_name: str
    team_id: int
    team_name: str
    season_id: int
    minutes_played: float
    appearances: int
    rating: Optional[float] = None
    goals_per90: float
    assists_per90: float
    shots_per90: float
    key_passes_per90: float
    passes_per90: float
    accurate_passes_per90: float
    successful_dribbles_per90: float
    tackles_per90: float
    interceptions_per90: float
    clearances_per90: float
    duels_won_per90: float
    touches_per90: float
    pass_accuracy_percentage: Optional[float] = None
    tackle_success_percentage: Optional[float] = None
    duel_win_percentage: Optional[float] = None
    shot_accuracy_percentage: Optional[float] = None


class PaginatedPlayersResponse(BaseModel):
    items: List[PlayerScoutingItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class PlayerSeasonTotals(BaseModel):
    appearances: int
    minutes_played: float
    goals: float
    assists: float
    shots_total: float
    shots_on_target: float
    passes: float
    accurate_passes: float
    key_passes: float
    successful_dribbles: float
    tackles: float
    tackles_won: float
    interceptions: float
    clearances: float
    duels_won: float
    duels_lost: float
    touches: float
    possession_lost: float
    average_rating: Optional[float] = None


class PlayerPer90Metrics(BaseModel):
    minutes_played: float
    goals_per90: float
    assists_per90: float
    shots_per90: float
    shots_on_target_per90: float
    key_passes_per90: float
    passes_per90: float
    accurate_passes_per90: float
    successful_dribbles_per90: float
    tackles_per90: float
    interceptions_per90: float
    clearances_per90: float
    duels_won_per90: float
    touches_per90: float


class PlayerDetail(BaseModel):
    player_id: int
    player_name: str
    team_id: int
    team_name: str
    season_id: int
    scouting_features: PlayerScoutingItem
    season_totals: PlayerSeasonTotals
    per90_metrics: PlayerPer90Metrics


class MetricComparison(BaseModel):
    metric: str
    label: str
    player1_value: Optional[float]
    player2_value: Optional[float]
    difference: Optional[float]
    leader_player_id: Optional[int]


class PlayerComparisonResponse(BaseModel):
    player1: PlayerScoutingItem
    player2: PlayerScoutingItem
    comparison_metrics: List[MetricComparison]


class TopPerformerRanking(BaseModel):
    category: str
    description: str
    formula: str
    criteria: str
    players: List[Dict[str, Any]]
