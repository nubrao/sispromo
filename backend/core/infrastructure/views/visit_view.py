from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from core.infrastructure.models.visit_model import VisitModel
from core.infrastructure.serializers.visit_serializer import VisitSerializer
from reportlab.pdfgen import canvas
from io import BytesIO
from rest_framework.decorators import action
from django.utils.dateparse import parse_date
from decimal import Decimal
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class VisitViewSet(viewsets.ModelViewSet):
    """ ViewSet para gerenciar Visitas """

    queryset = VisitModel.objects.select_related(
        "promoter", "store", "brand"
    ).all()
    serializer_class = VisitSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """ Lista todas as visitas """
        try:
            visits = self.get_queryset()
            serializer = self.get_serializer(visits, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erro ao listar visitas: {e}")
            return Response(
                {"error": "Erro ao buscar visitas."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """ Cria uma nova visita """
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                visit = serializer.save()
                return Response(
                    self
                    .get_serializer(visit)
                    .data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Erro ao criar visita: {e}")
                return Response(
                    {"error": "Erro ao criar visita."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao criar visita: {serializer.errors}")
            return Response(
                {"error": serializer.errors}, status=status
                .HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """ Atualiza uma visita existente """
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)

        if serializer.is_valid():
            try:
                visit = serializer.save()
                return Response(self
                                .get_serializer(visit)
                                .data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Erro ao atualizar visita: {e}")
                return Response(
                    {"error": "Erro ao atualizar visita."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.warning(
                f"Erro de validação ao atualizar visita: {serializer.errors}")
            return Response({"error": serializer.errors}, status=status
                            .HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """ Deleta uma visita """
        instance = self.get_object()

        try:
            instance.delete()
            return Response(
                {"message": "Visita excluída com sucesso."}, status=status
                .HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir visita: {e}")
            return Response(
                {"error": "Erro ao excluir visita."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"], url_path="reports")
    def get_report(self, request):
        """
        Gera um relatório filtrado e agrupado por promotor com base nos parâmetros:
        - promoter: ID do promotor
        - store: ID da loja
        - brand: ID da marca
        - start_date: Data inicial (YYYY-MM-DD)
        - end_date: Data final (YYYY-MM-DD)
        """
        promoter_id = request.query_params.get("promoter")
        store_id = request.query_params.get("store")
        brand_id = request.query_params.get("brand")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        queryset = VisitModel.objects.select_related(
            "promoter", "store", "brand").all()

        if promoter_id:
            queryset = queryset.filter(promoter_id=promoter_id)
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        if start_date:
            queryset = queryset.filter(visit_date__gte=parse_date(start_date))
        if end_date:
            queryset = queryset.filter(visit_date__lte=parse_date(end_date))

        # Ordena por data e promotor
        queryset = queryset.order_by("promoter", "visit_date")

        # Agrupa as visitas por promotor para calcular totais
        promoter_totals = {}
        visits_data = []

        for visit in queryset:
            promoter_id = visit.promoter.id
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
        queryset = VisitModel.objects.select_related(
            "promoter", "store", "brand").all()

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
            promoter_id = visit.promoter.id

            if promoter_id not in promoter_totals:
                promoter_totals[promoter_id] = {
                    'name': visit.promoter.name,
                    'total': 0
                }

            promoter_totals[promoter_id]['total'] += visit_price

            data.append({
                "Data": visit.visit_date.strftime("%d/%m/%Y"),
                "Promotor": visit.promoter.name,
                "Loja": f"{visit.store.name} - {visit.store.number}",
                "Marca": visit.brand.name if visit.brand else "N/A",
                "Valor da Visita (R$)": f"R$ {visit_price:.2f}",
            })

            # Adiciona linha de total após a última visita de cada promotor
            next_visit = visits.filter(id__gt=visit.id).first()
            if not next_visit or next_visit.promoter.id != promoter_id:
                data.append({
                    "Data": "",
                    "Promotor": (
                        f"Total Acumulado ({visit.promoter.name})"
                    ),
                    "Loja": "",
                    "Marca": "",
                    "Valor da Visita (R$)": (
                        f"R$ {promoter_totals[promoter_id]['total']:.2f}"
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
        y = 750  # Posição inicial Y
        line_height = 20  # Altura de cada linha

        current_promoter = None
        promoter_total = 0

        for visit in visits:
            # Se mudou o promotor, imprime o total do promoter anterior
            if current_promoter and current_promoter != visit.promoter:
                pdf.setFont("Helvetica-Bold", 10)
                total_text = (
                    f"Total Acumulado ({current_promoter.name}): "
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
            current_promoter = visit.promoter
            visit_price = float(
                self.get_serializer().get_visit_price(visit)
            )
            promoter_total += visit_price

            # Formata a data
            visit_date = visit.visit_date.strftime("%d/%m/%Y")

            # Informações da visita
            pdf.setFont("Helvetica", 10)
            visit_text = (
                f"{visit_date} - {visit.promoter.name} - "
                f"{visit.store.name} ({visit.store.number}) - "
                f"{visit.brand.name} - R$ {visit_price:.2f}"
            )

            # Nova página se necessário
            if y < 50:
                pdf.showPage()
                pdf.setFont("Helvetica", 10)
                y = 750

            pdf.drawString(50, y, visit_text)
            y -= line_height

        # Imprime o total do último promoter
        if current_promoter:
            pdf.setFont("Helvetica-Bold", 10)
            total_text = (
                f"Total Acumulado ({current_promoter.name}): "
                f"R$ {promoter_total:.2f}"
            )
            pdf.drawString(50, y, total_text)

        pdf.save()
        buffer.seek(0)

        response = HttpResponse(buffer, content_type="application/pdf")
        filename = 'attachment; filename="relatorio_visitas.pdf"'
        response['Content-Disposition'] = filename
        return response
