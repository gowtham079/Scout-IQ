from typing import List, Optional
from pydantic import BaseModel, Field


class TopScorer(BaseModel):
    player_id: int
    player_name: str
    team_name: str
    appearances: int
    minutes_played: float
    goals: float
    assists: float
    average_rating: Optional[float] = None


class TopAssister(BaseModel):
    player_id: int
    player_name: str
    team_name: str
    appearances: int
    minutes_played: float
    assists: float
    goals: float
    average_rating: Optional[float] = None


class TeamGoalSummary(BaseModel):
    team_id: int
    team_name: str
    goals_for: int
    goals_against: int
    goal_difference: int


class LeagueOverview(BaseModel):
    season_id: int
    total_unique_players: int = Field(..., description="Unique players active across the season")
    total_teams: int
    total_goals: int
    total_assists: int
    average_player_rating: float
    top_scorers: List[TopScorer]
    top_assisters: List[TopAssister]
    team_goal_distribution: List[TeamGoalSummary]
