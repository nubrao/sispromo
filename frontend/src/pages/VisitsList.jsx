import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, Table, Button, Space, Popconfirm, Tag, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCache } from "../hooks/useCache";
import { Toast } from "../components/Toast";
import Loader from "../components/Loader";
import VisitForm from "../components/visits/VisitForm";
import VisitFilters from "../components/visits/VisitFilters";
import api from "../services/api";

const VISIT_STATUS = {
    PENDING: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 4,
};

const VISIT_STATUS_COLORS = {
    [VISIT_STATUS.PENDING]: "orange",
    [VISIT_STATUS.IN_PROGRESS]: "blue",
    [VISIT_STATUS.COMPLETED]: "green",
    [VISIT_STATUS.CANCELLED]: "red",
};

const VisitsList = () => {
    const { t } = useTranslation(["visits", "common"]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);

    // Estados para os filtros
    const [filterPromoter, setFilterPromoter] = useState("");
    const [filterStore, setFilterStore] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterDate, setFilterDate] = useState("");

    // Usando o hook useCache para carregar os dados
    const {
        data: visitsData,
        loading: loadingVisits,
        error: visitsError,
    } = useCache(
        "/api/visits/",
        {},
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () => Toast.error(t("visits:messages.error.load")),
        }
    );

    const {
        data: promotersData,
        loading: loadingPromoters,
        error: promotersError,
    } = useCache(
        "/api/users/",
        { role: 1 }, // Filtra apenas promotores
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () =>
                Toast.error(t("visits:messages.error.load_promoters")),
        }
    );

    const {
        data: storesData,
        loading: loadingStores,
        error: storesError,
    } = useCache(
        "/api/stores/",
        {},
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () => Toast.error(t("visits:messages.error.load_stores")),
        }
    );

    const {
        data: brandsData,
        loading: loadingBrands,
        error: brandsError,
    } = useCache(
        "/api/brands/",
        {},
        {
            ttl: 30 * 60 * 1000, // 30 minutos
            onError: () => Toast.error(t("visits:messages.error.load_brands")),
        }
    );

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/visits/${id}/`);
            Toast.success(t("visits:messages.success.delete"));
            // Recarrega os dados do cache
            window.location.reload();
        } catch {
            Toast.error(t("visits:messages.error.delete"));
        }
    };

    const clearFilters = () => {
        setFilterPromoter("");
        setFilterStore("");
        setFilterBrand("");
        setFilterDate("");
    };

    const handleEdit = (visit) => {
        setEditingVisit(visit);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setEditingVisit(null);
    };

    // Filtragem dos dados
    const filteredVisits = useMemo(() => {
        if (!visitsData) return [];

        return visitsData.filter((visit) => {
            const promoterMatch =
                !filterPromoter ||
                visit.promoter.name
                    .toLowerCase()
                    .includes(filterPromoter.toLowerCase());
            const storeMatch =
                !filterStore ||
                visit.store.name
                    .toLowerCase()
                    .includes(filterStore.toLowerCase());
            const brandMatch =
                !filterBrand ||
                visit.brand.brand_name
                    .toLowerCase()
                    .includes(filterBrand.toLowerCase());
            const dateMatch = !filterDate || visit.visit_date === filterDate;

            return promoterMatch && storeMatch && brandMatch && dateMatch;
        });
    }, [visitsData, filterPromoter, filterStore, filterBrand, filterDate]);

    const columns = [
        {
            title: t("visits:list.columns.promoter"),
            dataIndex: ["promoter", "name"],
            sorter: (a, b) => a.promoter.name.localeCompare(b.promoter.name),
            width: 200,
        },
        {
            title: t("visits:list.columns.store"),
            dataIndex: ["store", "name"],
            render: (text, record) =>
                `${text} - ${record.store.number || "S/N"}`,
            sorter: (a, b) => a.store.name.localeCompare(b.store.name),
            width: 200,
        },
        {
            title: t("visits:list.columns.brand"),
            dataIndex: ["brand", "brand_name"],
            sorter: (a, b) =>
                a.brand.brand_name.localeCompare(b.brand.brand_name),
            width: 250,
        },
        {
            title: t("visits:list.columns.date"),
            dataIndex: "visit_date",
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.visit_date) - new Date(b.visit_date),
            width: 150,
        },
        {
            title: t("visits:list.columns.status"),
            dataIndex: "status",
            render: (status) => (
                <Tag color={VISIT_STATUS_COLORS[status]}>
                    {t(`visits:status.${status}`)}
                </Tag>
            ),
            filters: Object.entries(VISIT_STATUS).map(([, value]) => ({
                text: t(`visits:status.${value}`),
                value: value,
            })),
            onFilter: (value, record) => record.status === value,
            width: 150,
        },
        {
            title: t("visits:list.columns.actions"),
            className: "ant-table-cell-actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleEdit(record)}
                        className="form-button edit-button"
                    >
                        {t("common:table.actions.edit")}
                    </Button>
                    <Popconfirm
                        title={t("common:messages.confirm.delete")}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t("common:table.actions.confirm")}
                        cancelText={t("common:table.actions.cancel")}
                    >
                        <Button
                            type="primary"
                            danger
                            className="form-button delete-button"
                        >
                            {t("common:table.actions.delete")}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Se houver erro em alguma das requisições principais
    if (visitsError || promotersError || storesError || brandsError) {
        return <div>Erro ao carregar dados. Por favor, tente novamente.</div>;
    }

    // Se estiver carregando os dados principais
    if (loadingVisits || loadingPromoters || loadingStores || loadingBrands) {
        return <Loader />;
    }

    return (
        <>
            <Card title={t("visits:list.title")} className="form-title">
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingVisit(null);
                            setModalVisible(true);
                        }}
                        className="form-button"
                    >
                        {t("visits:buttons.new")}
                    </Button>
                </Space>

                <VisitFilters
                    filterPromoter={filterPromoter}
                    setFilterPromoter={setFilterPromoter}
                    filterStore={filterStore}
                    setFilterStore={setFilterStore}
                    filterBrand={filterBrand}
                    setFilterBrand={setFilterBrand}
                    filterDate={filterDate}
                    setFilterDate={setFilterDate}
                    clearFilters={clearFilters}
                    isPromoter={false}
                />

                <Table
                    bordered
                    dataSource={filteredVisits}
                    columns={columns}
                    loading={loadingVisits}
                    tableLayout="fixed"
                    rowKey="id"
                />
            </Card>

            <Modal
                title={
                    editingVisit
                        ? t("visits:form.edit_title")
                        : t("visits:form.create_title")
                }
                open={modalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={800}
            >
                <VisitForm
                    visit={editingVisit}
                    onClose={handleModalClose}
                    promoters={promotersData}
                    stores={storesData}
                    brands={brandsData}
                />
            </Modal>
        </>
    );
};

export default VisitsList;
