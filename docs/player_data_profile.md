# ScoutIQ — Player & Match Analytics Data Profile

## 1. Executive Summary

- **Fixtures Ingested:** 192 (100% of season schedule)
- **Lineup Records:** 7666
- **Unique Players Identified:** 412
- **Unique Teams Identified:** 12
- **Match Events Recorded:** 3186
- **Player Match Statistics Records:** 154741
- **Unique Player Statistic Types:** 69
- **Team Match Statistics Records:** 2198
- **Unique Team Statistic Types:** 8

---

## 2. Match Events Breakdown

Total events analyzed: 3186

| Event Code | Event Name | Occurrences |
|:---|:---|:---|
| `substitution` | Substitution | 1793 |
| `yellowcard` | Yellowcard | 664 |
| `goal` | Goal | 533 |
| `VAR` | VAR | 85 |
| `penalty` | Penalty | 47 |
| `redcard` | Redcard | 16 |
| `owngoal` | Own Goal | 15 |
| `VAR_CARD` | VAR_CARD | 14 |
| `yellowredcard` | Yellow/Red card | 11 |
| `missed_penalty` | Missed Penalty | 8 |

---

## 3. Team Match Statistics Catalog

Total unique team stat types: 8

| Stat Code | Stat Name | Occurrences |
|:---|:---|:---|
| `corners` | Corners | 384 |
| `ball-possession` | Ball Possession % | 384 |
| `successful-dribbles-percentage` | Successful Dribbles Percentage | 384 |
| `yellowcards` | Yellowcards | 370 |
| `goals` | Goals | 362 |
| `assists` | Assists | 240 |
| `redcards` | Redcards | 52 |
| `yellowred-cards` | Yellowred Cards | 22 |

---

## 4. Player Statistics Catalog (Sample Top 25)

Total unique player stat types: 69

| Code | Metric Name | Category / Group | Occurrences |
|:---|:---|:---|:---|
| `cumulative-minutes-played` | Cumulative Minutes Played | None | 6018 |
| `minutes-played` | Minutes Played | NULL | 6017 |
| `touches` | Touches | overall | 5996 |
| `passes` | Passes | overall | 5946 |
| `accurate-passes` | Accurate Passes | overall | 5886 |
| `accurate-passes-percentage` | Accurate Passes Percentage | offensive | 5880 |
| `possession-lost` | Possession Lost | overall | 5806 |
| `rating` | Rating | overall | 5794 |
| `total-duels` | Total Duels | offensive | 5575 |
| `duels-won` | Duels Won | offensive | 5078 |
| `backward-passes` | Backward Passes | overall | 5051 |
| `ball-recovery` | Ball Recovery | overall | 4995 |
| `duels-lost` | Duels Lost | offensive | 4981 |
| `passes-in-final-third` | Passes In Final Third | overall | 4794 |
| `long-balls` | Long Balls | overall | 4411 |
| `goals-conceded` | Goals Conceded | defensive | 3642 |
| `clearances` | Clearances | defensive | 3619 |
| `long-balls-won` | Long Balls Won | overall | 3532 |
| `long-balls-won-percentage` | Long Balls Won Percentage | overall | 3453 |
| `tackles` | Tackles | defensive | 3446 |
| `dribble-attempts` | Dribble Attempts | offensive | 2881 |
| `fouls` | Fouls | defensive | 2848 |
| `aeriels-lost` | Aerials Lost | overall | 2826 |
| `shots-total` | Shots Total | offensive | 2823 |
| `fouls-drawn` | Fouls Drawn | overall | 2692 |

---

## 5. Player Master Attribute Availability

Sample player records extracted from lineups:
```json
[
  {
    "player_id": 37619474,
    "name": "Munashe Garananga",
    "height": 188,
    "image_path": "https://cdn.sportmonks.com/images/soccer/players/18/37619474.png",
    "nationality_id": 2325,
    "country_id": 2325
  },
  {
    "player_id": 37295961,
    "name": "Gabriel Pereira Magalh\u00e3es dos Santos",
    "height": 188,
    "image_path": "https://cdn.sportmonks.com/images/soccer/players/25/37295961.png",
    "nationality_id": 5,
    "country_id": 5
  },
  {
    "player_id": 26719,
    "name": "Pantelis Hatzidiakos",
    "height": 185,
    "image_path": "https://cdn.sportmonks.com/images/soccer/players/31/26719.png",
    "nationality_id": 125,
    "country_id": 125
  }
]
```
