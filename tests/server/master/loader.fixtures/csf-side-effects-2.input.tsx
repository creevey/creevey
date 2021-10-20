// @ts-nocheck
import React from "react";
import { createSinglePageComponent } from "billing-ui/helpers/createPage";
import { CreateRefundModal, openCreateRefundModal } from "../../../../../Web/Partner/Partner.Service/App/Components/CreateRefundModal";
import { useActions } from "billing-ui/hooks";
import { useEffect } from 'react';
import { buildRefundApiMock, buildRefundCreatedApiMock, buildRefundApplicationApiMock, buildRefundApplicationCreatedApiMock } from "./api";
import { withMockedApi } from "../../../src/helpers/decorators";

export default {
    title: "Partner/CreateRefundModal",
    component: CreateRefundModal,
    parameters: {
        creevey: {
            skip: [
                {
                    in: ["chromeMobile"],
                    reason: "Мобилки пока не поддерживаются"
                }
            ]
        }
    }
};

const RefundComponent = createSinglePageComponent(
    () => {
        const actions = useActions({ openCreateRefundModal });

        useEffect(() => {
            actions.openCreateRefundModal({ BillId: "BillId" })
        }, [])

        return <CreateRefundModal />;
    },
    undefined,
    undefined,
    {},
    { storeName: "RefundModalStore" }
);

export const CreateRefund = () => <RefundComponent />;

CreateRefund.decorators = [withMockedApi(buildRefundApiMock())];

export const RefundCreated = () => <RefundComponent />;

RefundCreated.decorators = [withMockedApi(buildRefundCreatedApiMock())];

export const CreateRefundApplication = () => <RefundComponent />;

CreateRefundApplication.decorators = [withMockedApi(buildRefundApplicationApiMock())];

export const RefundApplicationCreated = () => <RefundComponent />;

RefundApplicationCreated.decorators = [withMockedApi(buildRefundApplicationCreatedApiMock())];
