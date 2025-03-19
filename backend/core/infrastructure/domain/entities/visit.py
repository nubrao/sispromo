class Visit:
    def __init__(
        self,
        id: int,
        promoter_id: int,
        store_id: int,
        brand_id: int,
        visit_date: str
    ):
        self.id = id
        self.promoter_id = promoter_id
        self.store_id = store_id
        self.brand_id = brand_id
        self.visit_date = visit_date
