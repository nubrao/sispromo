from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from core.infrastructure.serializers.visit_serializer import VisitSerializer
from core.infrastructure.repositories.visit_repository import DjangoVisitRepository
from core.domain.entities.visit import Visit
from reportlab.pdfgen import canvas
from io import BytesIO
from rest_framework.decorators import action
from decimal import Decimal
import pandas as pd
import logging
from datetime import datetime, timedelta
from core.infrastructure.models.brand_model import BrandModel
from core.infrastructure.models.promoter_model import PromoterModel
from core.infrastructure.models.promoter_brand_model import PromoterBrandModel
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter
)
from typing import List, Optional

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="Lista todas as visitas cadastradas",
        responses={
            200: VisitSerializer(many=True),
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    create=extend_schema(
        description="Cria uma nova visita",
        request=VisitSerializer,
        responses={
            201: VisitSerializer,
            400: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    update=extend_schema(
        description="Atualiza uma visita existente",
        request=VisitSerializer,
        responses={
            200: VisitSerializer,
            400: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    destroy=extend_schema(
        description="Deleta uma visita",
        responses={
            204: None,
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
)
class VisitViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Visitas """

    serializer_class = VisitSerializer
    visit_repository = DjangoVisitRepository()

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Retorna o queryset de visitas filtrado com base no papel do usuário.
        Se o usuário for um promotor, retorna apenas suas visitas.
        Se for analista ou gerente, retorna todas as visitas.
        """
        user = self.request.user
        if user.userprofile.role == 'promoter':
            return self.visit_repository.get_visits_by_filters(user_id=user.id)
        return self.visit_repository.list_all()

    def retrieve(self, request, *args, **kwargs):
        """Busca uma visita específica"""
        visit = self.visit_repository.get_by_id(int(kwargs['pk']))
        if not visit:
            return Response(
                {"error": "Visita não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(visit)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Cria uma nova visita"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Cria a entidade Visit
        visit = Visit(
            id=None,
            promoter_id=serializer.validated_data['promoter'].id,
            store_id=serializer.validated_data['store'].id,
            brand=serializer.validated_data['brand'],
            visit_date=str(serializer.validated_data['visit_date'])
        )

        # Salva usando o repositório
        created_visit = self.visit_repository.create(visit)

        # Serializa a resposta
        response_serializer = self.get_serializer(created_visit)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Atualiza uma visita existente"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)

        # Cria a entidade Visit
        visit = Visit(
            id=instance.id,
            promoter_id=serializer.validated_data['promoter'].id,
            store_id=serializer.validated_data['store'].id,
            brand=serializer.validated_data['brand'],
            visit_date=str(serializer.validated_data['visit_date'])
        )

        # Atualiza usando o repositório
        updated_visit = self.visit_repository.update(visit)

        # Serializa a resposta
        response_serializer = self.get_serializer(updated_visit)
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Remove uma visita"""
        visit_id = int(kwargs['pk'])
        try:
            self.visit_repository.delete(visit_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        description=(
            "Gera um relatório de visitas com filtros e totais por promotor"
        ),
        parameters=[
            OpenApiParameter(
                name="promoter",
                description="ID do promotor para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="store",
                description="ID da loja para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="brand",
                description="ID da marca para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="start_date",
                description="Data inicial (YYYY-MM-DD)",
                required=False,
                type=str
            ),
            OpenApiParameter(
                name="end_date",
                description="Data final (YYYY-MM-DD)",
                required=False,
                type=str
            )
        ],
        responses={
            200: VisitSerializer(many=True),
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
    @action(detail=False, methods=["get"], url_path="reports")
    def get_report(self, request):
        """
        Gera um relatório filtrado e agrupado por promotor com base nos parâmetros:
        - promoter: ID do promotor (apenas para analistas/gerentes)
        - store: ID da loja
        - brand: ID da marca
        - start_date: Data inicial (YYYY-MM-DD)
        - end_date: Data final (YYYY-MM-DD)
        """
        # Se for promotor, força o filtro para mostrar apenas suas visitas
        if request.user.userprofile.role == 'promoter':
            try:
                promoter = PromoterModel.objects.get(
                    user_profile=request.user.userprofile)
                promoter_id = promoter.id
            except PromoterModel.DoesNotExist:
                return Response(
                    {"error": "Usuário não possui um promotor associado."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            promoter_id = request.query_params.get("promoter")

        # Busca visitas usando o repositório
        visits = self.visit_repository.get_visits_by_filters(
            promoter_id=promoter_id if promoter_id else None,
            store_id=request.query_params.get("store"),
            brand_id=request.query_params.get("brand"),
            start_date=request.query_params.get("start_date"),
            end_date=request.query_params.get("end_date"),
            user_id=request.user.id if request.user.userprofile.role == 'promoter' else None
        )

        # Agrupa as visitas por promotor para calcular totais
        promoter_totals = {}
        visits_data = []

        for visit in visits:
            promoter_id = visit.promoter_id
            visit_price = Decimal(
                str(self.get_serializer().get_visit_price(visit)))

            if promoter_id not in promoter_totals:
                promoter_totals[promoter_id] = {
                    'total_visits': 0,
                    'total_value': Decimal('0.00'),
                    'promoter_name': visit.promoter.name
                }

            promoter_totals[promoter_id]['total_visits'] += 1
            promoter_totals[promoter_id]['total_value'] += visit_price

            visit_data = self.get_serializer(visit).data
            visit_data['promoter_total_visits'] = promoter_totals[promoter_id]['total_visits']
            visit_data['promoter_total_value'] = float(
                promoter_totals[promoter_id]['total_value'])
            visit_data['visit_price'] = float(visit_price)
            visits_data.append(visit_data)

        return Response(visits_data, status=status.HTTP_200_OK)

    def _filter_visits(self, request):
        """Aplica os filtros na busca de visitas"""
        queryset = self.get_queryset()

        promoter_id = request.GET.get('promoter')
        store_id = request.GET.get('store')
        brand_id = request.GET.get('brand')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if promoter_id:
            queryset = queryset.filter(promoter__id=promoter_id)
        if store_id:
            queryset = queryset.filter(store__id=store_id)
        if brand_id:
            queryset = queryset.filter(brand__id=brand_id)
        if start_date:
            queryset = queryset.filter(visit_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(visit_date__lte=end_date)

        return queryset

    @extend_schema(
        description="Exporta relatório de visitas para Excel",
        parameters=[
            OpenApiParameter(
                name="promoter",
                description="ID do promotor para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="store",
                description="ID da loja para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="brand",
                description="ID da marca para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="start_date",
                description="Data inicial (YYYY-MM-DD)",
                required=False,
                type=str
            ),
            OpenApiParameter(
                name="end_date",
                description="Data final (YYYY-MM-DD)",
                required=False,
                type=str
            )
        ],
        responses={
            200: {"type": "string", "format": "binary"},
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        """Exporta visitas filtradas para Excel com totais por promotor"""
        visits = self._filter_visits(request)

        # Ordenar por promotor e data
        visits = visits.order_by('promoter__name', 'visit_date')

        # Preparar dados com totais por promotor
        data = []
        promoter_totals = {}

        for visit in visits:
            visit_price = float(self.get_serializer().get_visit_price(visit))
            promoter_name = visit.promoter.name.upper()

            if promoter_name not in promoter_totals:
                promoter_totals[promoter_name] = {
                    'name': visit.promoter.name.upper(),
                    'total': 0
                }

            promoter_totals[promoter_name]['total'] += visit_price

            data.append({
                "Data": visit.visit_date.strftime("%d/%m/%Y"),
                "Promotor": visit.promoter.name.upper(),
                "Loja": f"{visit.store.name.upper()} - {visit.store.number}",
                "Marca": visit.brand.name.upper() if visit.brand else "N/A",
                "Valor da Visita (R$)": f"R$ {visit_price:.2f}",
            })

            # Adiciona linha de total após a última visita de cada promotor
            next_visit = visits.filter(id__gt=visit.id).first()
            if not next_visit or next_visit.promoter.name.upper() != promoter_name:
                data.append({
                    "Data": "",
                    "Promotor": (
                        f"Total Acumulado ({promoter_name})"
                    ),
                    "Loja": "",
                    "Marca": "",
                    "Valor da Visita (R$)": (
                        f"R$ {promoter_totals[promoter_name]['total']:.2f}"
                    ),
                })
                # Adiciona uma linha em branco após o total
                data.append({
                    "Data": "",
                    "Promotor": "",
                    "Loja": "",
                    "Marca": "",
                    "Valor da Visita (R$)": "",
                })

        df = pd.DataFrame(data)

        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name="Relatório", index=False)

            # Ajustar formatação
            workbook = writer.book
            worksheet = writer.sheets["Relatório"]

            # Formato para linhas de total
            total_format = workbook.add_format({
                'bold': True,
                'bg_color': '#F0F0F0'
            })

            # Aplicar formatação nas linhas de total
            for row_num in range(len(data)):
                if "Total Acumulado" in str(df.iloc[row_num]["Promotor"]):
                    worksheet.set_row(row_num + 1, None, total_format)

            # Ajustar largura das colunas
            for i, col in enumerate(df.columns):
                max_length = max(
                    df[col].astype(str).apply(len).max(),
                    len(col)
                ) + 2
                worksheet.set_column(i, i, max_length)

        response = HttpResponse(
            output.getvalue(),
            content_type=(
                "application/vnd.openxmlformats-officedocument"
                ".spreadsheetml.sheet"
            )
        )
        filename = 'attachment; filename="relatorio_visitas.xlsx"'
        response['Content-Disposition'] = filename
        return response

    @extend_schema(
        description="Exporta relatório de visitas para PDF",
        parameters=[
            OpenApiParameter(
                name="promoter",
                description="ID do promotor para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="store",
                description="ID da loja para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="brand",
                description="ID da marca para filtrar",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="start_date",
                description="Data inicial (YYYY-MM-DD)",
                required=False,
                type=str
            ),
            OpenApiParameter(
                name="end_date",
                description="Data final (YYYY-MM-DD)",
                required=False,
                type=str
            )
        ],
        responses={
            200: {"type": "string", "format": "binary"},
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        """Exporta visitas filtradas para PDF com totais por promotor"""
        visits = self._filter_visits(request)

        # Ordenar por promotor e data
        visits = visits.order_by('promoter__name', 'visit_date')

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer)

        # Configurações iniciais do PDF
        pdf.setTitle("Relatório de Visitas")
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(50, 800, "Relatório de Visitas")

        # Configurações para o conteúdo
        pdf.setFont("Helvetica", 10)
        y = 750
        line_height = 20  # Altura de cada linha

        current_promoter_name = None
        promoter_total = 0

        for visit in visits:
            # Se mudou o promotor, imprime o total do promoter anterior
            visit_promoter_name = visit.promoter.name.upper()
            if current_promoter_name and current_promoter_name != visit_promoter_name:
                pdf.setFont("Helvetica-Bold", 10)
                total_text = (
                    f"Total Acumulado ({current_promoter_name}): "
                    f"R$ {promoter_total:.2f}"
                )
                pdf.drawString(50, y, total_text)
                y -= line_height * 2  # Espaço extra após o total
                promoter_total = 0

                # Nova página se necessário
                if y < 50:
                    pdf.showPage()
                    pdf.setFont("Helvetica", 10)
                    y = 750

            # Atualiza o promoter atual
            current_promoter_name = visit_promoter_name
            visit_price = float(
                self.get_serializer().get_visit_price(visit)
            )
            promoter_total += visit_price

            # Formata a data
            visit_date = visit.visit_date.strftime("%d/%m/%Y")

            # Informações da visita
            pdf.setFont("Helvetica", 10)
            visit_text = (
                f"{visit_date} - {visit.promoter.name.upper()} - "
                f"{visit.store.name.upper()} ({visit.store.number}) - "
                f"{visit.brand.name.upper()} - R$ {visit_price:.2f}"
            )

            # Nova página se necessário
            if y < 50:
                pdf.showPage()
                pdf.setFont("Helvetica", 10)
                y = 750

            pdf.drawString(50, y, visit_text)
            y -= line_height

        # Imprime o total do último promoter
        if current_promoter_name:
            pdf.setFont("Helvetica-Bold", 10)
            total_text = (
                f"Total Acumulado ({current_promoter_name}): "
                f"R$ {promoter_total:.2f}"
            )
            pdf.drawString(50, y, total_text)

        pdf.save()
        buffer.seek(0)

        response = HttpResponse(buffer, content_type="application/pdf")
        filename = 'attachment; filename="relatorio_visitas.pdf"'
        response['Content-Disposition'] = filename
        return response

    @extend_schema(
        description=(
            "Retorna dados para o dashboard com métricas de visitas por marca e loja"
        ),
        responses={
            200: {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "brand_id": {"type": "integer"},
                        "brand_name": {"type": "string"},
                        "total_stores": {"type": "integer"},
                        "total_visits_done": {"type": "integer"},
                        "total_visits_expected": {"type": "integer"},
                        "total_progress": {"type": "number"},
                        "stores": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "store_id": {"type": "integer"},
                                    "store_name": {"type": "string"},
                                    "store_number": {"type": "string"},
                                    "visit_frequency": {"type": "integer"},
                                    "visits_done": {"type": "integer"},
                                    "visits_remaining": {"type": "integer"},
                                    "progress": {"type": "number"},
                                    "last_visit": {
                                        "type": "string",
                                        "format": "date"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    )
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Retorna dados para o dashboard"""
        try:
            user = request.user
            today = datetime.now()
            # Encontra o início da semana (segunda-feira)
            start_of_week = today - timedelta(days=today.weekday())
            start_of_week = start_of_week.replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            # Encontra o fim da semana (domingo)
            end_of_week = (
                start_of_week +
                timedelta(days=6, hours=23, minutes=59, seconds=59)
            )

            # Busca visitas usando o repositório
            user_id = (
                user.id if user.userprofile.role == 'promoter' else None
            )
            visits = self.visit_repository.get_visits_for_dashboard(
                start_date=start_of_week,
                end_date=end_of_week,
                user_id=user_id
            )

            # Se for promotor, filtra apenas as marcas atribuídas
            if user.userprofile.role == 'promoter':
                try:
                    promoter = PromoterModel.objects.get(
                        user_profile=user.userprofile
                    )
                    # Obtém as marcas atribuídas ao promotor
                    brand_assignments = PromoterBrandModel.objects.filter(
                        promoter=promoter
                    )
                    brands = BrandModel.objects.filter(
                        id__in=brand_assignments.values('brand_id')
                    ).prefetch_related('brandstore_set__store')
                except PromoterModel.DoesNotExist:
                    return Response(
                        {"error": "Usuário não possui um promotor associado."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Para gestores e analistas, mostra todas as marcas
                brands = BrandModel.objects.prefetch_related(
                    'brandstore_set__store'
                ).all()

            # Prepara os dados para o dashboard
            dashboard_data = []

            for brand in brands:
                brand_data = {
                    'brand_id': brand.brand_id,
                    'brand_name': brand.name,
                    'stores': []
                }

                for brand_store in brand.brandstore_set.all():
                    store_visits = visits.filter(
                        brand=brand,
                        store=brand_store.store
                    )

                    # Calcula o número de visitas realizadas e esperadas
                    visits_done = store_visits.count()
                    expected_visits = brand_store.visit_frequency

                    # Calcula o progresso
                    progress = (
                        min(100, (visits_done / expected_visits) * 100)
                        if expected_visits > 0 else 0
                    )

                    store_data = {
                        'store_id': brand_store.store.id,
                        'store_name': brand_store.store.name,
                        'store_number': brand_store.store.number,
                        'visit_frequency': brand_store.visit_frequency,
                        'visits_done': visits_done,
                        'visits_remaining': (
                            max(0, expected_visits - visits_done)
                        ),
                        'progress': progress,
                        'last_visit': (
                            store_visits.order_by('-visit_date')
                            .first().visit_date if store_visits.exists()
                            else None
                        )
                    }

                    brand_data['stores'].append(store_data)

                # Calcula totais para a marca
                brand_data['total_stores'] = len(brand_data['stores'])
                brand_data['total_visits_done'] = sum(
                    store['visits_done'] for store in brand_data['stores']
                )
                brand_data['total_visits_expected'] = sum(
                    store['visit_frequency']
                    for store in brand_data['stores']
                )

                total_expected = brand_data['total_visits_expected']
                total_done = brand_data['total_visits_done']
                brand_data['total_progress'] = (
                    (total_done / total_expected) * 100
                    if total_expected > 0 else 0
                )

                dashboard_data.append(brand_data)

            return Response(dashboard_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Erro ao gerar dados do dashboard: {e}")
            return Response(
                {"error": "Erro ao gerar dados do dashboard."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        """Executa a criação de uma visita"""
        # Se o usuário for promotor, associa o promotor atual à visita
        if self.request.user.userprofile.role == 'promoter':
            try:
                promoter = PromoterModel.get_promoter_by_user(
                    self.request.user
                )
                if not promoter:
                    raise serializers.ValidationError(
                        "Usuário não possui um promotor associado."
                    )
                serializer.save(promoter=promoter)
            except PromoterModel.DoesNotExist:
                raise serializers.ValidationError(
                    "Usuário não possui um promotor associado."
                )
        else:
            # Se for gestor ou analista, usa o promotor selecionado
            promoter_id = self.request.data.get('promoter')
            if not promoter_id:
                raise serializers.ValidationError(
                    "ID do promotor não fornecido."
                )

            try:
                promoter = PromoterModel.objects.get(id=promoter_id)
                serializer.save(promoter=promoter)
            except PromoterModel.DoesNotExist:
                raise serializers.ValidationError(
                    "Promotor não encontrado."
                )

    def get_visits_by_filters(
        self,
        promoter_id: Optional[int] = None,
        store_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> List[Visit]:
        """
        Busca visitas aplicando filtros

        Args:
            promoter_id: ID do promotor
            store_id: ID da loja
            brand_id: ID da marca
            start_date: Data inicial (YYYY-MM-DD)
            end_date: Data final (YYYY-MM-DD)
            user_id: ID do usuário (para filtrar visitas de um promotor)
        """
        return self.visit_repository.get_visits_by_filters(
            promoter_id=promoter_id,
            store_id=store_id,
            brand_id=brand_id,
            start_date=start_date,
            end_date=end_date,
            user_id=user_id
        )
