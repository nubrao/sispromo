class Visit:
    def __init__(self, id: int, promoter_id: int, store_id: int, brand: str, visit_date: str, photo_url: str):
        self.id = id
        self.promoter_id = promoter_id
        self.store_id = store_id
        self.brand = brand
        self.visit_date = visit_date
        self.photo_url = photo_url
