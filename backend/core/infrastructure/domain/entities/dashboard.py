from dataclasses import dataclass
from typing import List
from datetime import date

@dataclass
class BrandProgress:
    brand_id: int
    brand_name: str
    visits_done: int
    visits_pending: int
    total_visits: int

@dataclass
class StoreProgress:
    store_id: int
    store_name: str
    store_number: str
    visits_done: int
    visits_pending: int
    total_visits: int

@dataclass
class PromoterProgress:
    promoter_id: int
    promoter_name: str
    visits_done: int
    visits_pending: int
    total_visits: int

@dataclass
class DashboardData:
    total_visits: int
    total_completed: int
    total_pending: int
    brands_progress: List[BrandProgress]
    promoters_progress: List[PromoterProgress]
    stores_progress: List[StoreProgress]