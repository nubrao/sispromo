class Promoter:
    def __init__(
        self,
        id: int,
        first_name: str,
        last_name: str,
        cpf: str,
        phone: str,
        email: str = None,
        user_id: int = None
    ):
        self.id = id
        self.first_name = first_name
        self.last_name = last_name
        self.cpf = cpf
        self.phone = phone
        self.email = email
        self.user_id = user_id

    @property
    def name(self) -> str:
        """Retorna o nome completo do promotor"""
        return f"{self.first_name} {self.last_name}".strip()

    def to_dict(self) -> dict:
        """Converte a entidade para um dicionário"""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'name': self.name,
            'cpf': self.cpf,
            'phone': self.phone,
            'email': self.email,
            'user_id': self.user_id
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Promoter':
        """Cria uma instância da entidade a partir de um dicionário"""
        return cls(
            id=data.get('id'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            cpf=data.get('cpf'),
            phone=data.get('phone'),
            email=data.get('email'),
            user_id=data.get('user_id')
        )
