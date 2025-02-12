from rest_framework.response import Response
from rest_framework.views import APIView
from core.infrastructure.models.state_model import StateChoices


class StateListView(APIView):
    def get(self, request):
        return Response({"states": StateChoices.choices})
