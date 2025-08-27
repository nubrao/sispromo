from rest_framework import viewsets, status 
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from core.infrastructure.serializers.visit_serializer import VisitSerializer
from core.infrastructure.repositories.visit_repository import DjangoVisitRepository  # noqa: E501
from core.infrastructure.domain.entities.visit import Visit
from core.infrastructure.models.visit_model import VisitModel
from reportlab.pdfgen import canvas
from io import BytesIO
from rest_framework.decorators import action
from decimal import Decimal
import pandas as pd
from django.utils import timezone
from datetime import datetime, timedelta
import logging
from core.infrastructure.models.user_model import User
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiTypes
)
from typing import List, Optional

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        description="""Lista todas as visitas cadastradas.
        - Promotores (role=1) veem apenas suas próprias visitas
        - Analistas (role=2) e Gestores (role=3) veem todas as visitas""",
        responses={
            200: VisitSerializer(many=True),
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    retrieve=extend_schema(
        description="Busca uma visita específica pelo ID",
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID da visita",
                required=True
            )
        ],
        responses={
            200: VisitSerializer,
            404: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    create=extend_schema(
        description="""Cria uma nova visita.
        - Promotores (role=1) só podem criar visitas para si mesmos
        - Analistas (role=2) e Gestores (role=3) podem criar para qualquer promotor""",
        request=VisitSerializer,
        responses={
            201: VisitSerializer,
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Detalhes do erro de validação"
                    },
                    "promoter": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Erros relacionados ao promotor"
                    },
                    "brand": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Erros relacionados à marca"
                    }
                }
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    update=extend_schema(
        description="""Atualiza uma visita existente.
        - Promotores (role=1) só podem atualizar suas próprias visitas
        - Analistas (role=2) e Gestores (role=3) podem atualizar qualquer visita""",
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID da visita",
                required=True
            )
        ],
        request=VisitSerializer,
        responses={
            200: VisitSerializer,
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "description": "Detalhes do erro de validação"
                    }
                }
            },
            500: {
                "type": "object",
                "properties": {"error": {"type": "string"}}
            }
        }
    ),
    destroy=extend_schema(
        description="""Deleta uma visita.
        - Promotores (role=1) só podem deletar suas próprias visitas
        - Analistas (role=2) e Gestores (role=3) podem deletar qualquer visita""",
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID da visita",
                required=True
            )
        ],
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
    queryset = VisitModel.objects.all()
    lookup_field = 'pk'
    lookup_url_kwarg = 'id'
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtra as visitas com base no papel do usuário:
        - Promotores veem apenas suas próprias visitas
        - Gerentes veem visitas de suas marcas
        - Administradores veem todas as visitas
        """
        user = self.request.user
        queryset = VisitModel.objects.all()

        if user.role == 1:  # Promotor
            return queryset.filter(promoter=user)
        elif user.role == 2:  # Gerente
            return queryset.filter(brand__manager=user)
        elif user.role == 3:  # Administrador
            return queryset

        return queryset.none()

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
        Gera um relatório filtrado e agrupado por promotor com base nos
        parâmetros:
        - promoter: ID do promotor (apenas para analistas/gerentes)
        - store: ID da loja
        - brand: ID da marca
        - start_date: Data inicial (YYYY-MM-DD)
        - end_date: Data final (YYYY-MM-DD)
        """
        # Se for promotor, força o filtro para mostrar apenas suas visitas
        if request.user.role == 1:
            try:
                promoter = User.objects.get(
                    user_profile=request.user.userprofile)
                promoter_id = promoter.id
            except User.DoesNotExist:
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
            user_id=request.user.id if (
                request.user.role == 1) else None
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
            visit_data['promoter_total_visits'] = promoter_totals[
                promoter_id]['total_visits']
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
            if not next_visit or next_visit.promoter.name.upper() != promoter_name:  # noqa: E501
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
            if current_promoter_name and current_promoter_name != visit_promoter_name:  # noqa: E501
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
            "Retorna dados para o dashboard com métricas de visitas por marca e loja"  # noqa: E501
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
    def perform_create(self, serializer):
        """
        Ao criar uma visita, define o promotor como o usuário atual
        se ele for um promotor
        """
        if self.request.user.role == 1:
            serializer.save(promoter=self.request.user)
        else:
            serializer.save()

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

    @action(detail=False, methods=['get'])
    def report(self, request):
        """Generate report with optional filters."""
        try:
            logger.info(f"Report request params: {request.query_params}")
            
            # Initialize dates
            today = timezone.now().date()
            start_date = None
            end_date = None
            
            # Get date parameters
            start_date_param = request.query_params.get('start_date')
            end_date_param = request.query_params.get('end_date')

            try:
                if start_date_param and end_date_param:
                    start_date = datetime.strptime(start_date_param, '%Y-%m-%d').date()
                    end_date = datetime.strptime(end_date_param, '%Y-%m-%d').date()
                else:
                    # Default to last 2 months
                    start_date = today - timedelta(days=60)
                    end_date = today
            except ValueError as e:
                logger.error(f"Date parsing error: {e}")
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Build filters
            filters = {
                'visit_date__gte': start_date,
                'visit_date__lte': end_date
            }

            # Add optional ID filters
            for param_name in ['promoter_id', 'brand_id', 'store_id']:
                param_value = request.query_params.get(param_name)
                if param_value:
                    try:
                        filters[param_name] = int(param_value)
                    except ValueError:
                        return Response(
                            {"error": f"Invalid {param_name}: must be a number"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

            logger.info(f"Applying filters: {filters}")
            queryset = self.get_queryset().filter(**filters)

            # Generate report data
            report_data = {
                "period": {
                    "start_date": start_date.strftime('%Y-%m-%d'),
                    "end_date": end_date.strftime('%Y-%m-%d')
                },
                "summary": {
                    "total_visits": 0,
                    "total_value": 0.0,
                    "unique_promoters": 0,
                    "unique_stores": 0,
                    "unique_brands": 0
                },
                "visits": []
            }

            # Process visits
            unique_promoters = set()
            unique_stores = set()
            unique_brands = set()

            for visit in queryset:
                try:
                    visit_price = float(self.get_serializer().get_visit_price(visit))
                except (TypeError, ValueError):
                    visit_price = 0.0

                visit_data = {
                    'id': visit.id,
                    'date': visit.visit_date.strftime('%Y-%m-%d'),
                    'promoter': {
                        'id': visit.promoter.id,
                        'name': visit.promoter.get_full_name()
                    },
                    'store': {
                        'id': visit.store.id,
                        'name': visit.store.name,
                        'number': visit.store.number
                    },
                    'brand': {
                        'id': visit.brand.id,
                        'name': visit.brand.name
                    },
                    'value': visit_price,
                    'status': visit.status
                }
                
                report_data['visits'].append(visit_data)
                report_data['summary']['total_visits'] += 1
                report_data['summary']['total_value'] += visit_price
                
                unique_promoters.add(visit.promoter_id)
                unique_stores.add(visit.store_id)
                unique_brands.add(visit.brand_id)

            # Update summary counts
            report_data['summary']['unique_promoters'] = len(unique_promoters)
            report_data['summary']['unique_stores'] = len(unique_stores)
            report_data['summary']['unique_brands'] = len(unique_brands)

            return Response(report_data)

        except Exception as e:
            logger.exception("Error generating report")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )