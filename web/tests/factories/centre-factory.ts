import { Factory } from "fishery"

import { type CentreAsShow, CentreStatuses } from "@/api/centres-api"

export const centreFactory = Factory.define<CentreAsShow>(({ sequence }) => {
  const timestamp = "2026-01-01T00:00:00.000Z"

  return {
    id: sequence,
    fundingRegionId: sequence,
    name: `Child Care Centre ${sequence}`,
    community: "Whitehorse",
    status: CentreStatuses.ACTIVE,
    isFirstNationProgram: false,
    license: null,
    hotMeal: false,
    licensedFor: null,
    licenseHolderName: null,
    contactName: null,
    physicalAddress: null,
    mailingAddress: null,
    email: null,
    altEmail: null,
    phoneNumber: null,
    altPhoneNumber: null,
    faxNumber: null,
    vendorIdentifier: null,
    inspectorName: null,
    neighborhood: null,
    lastSubmission: null,
    buildingUsagePercent: "100.00",
    createdAt: timestamp,
    updatedAt: timestamp,
  }
})

export default centreFactory
