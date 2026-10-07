import { isNil } from "lodash"

import logger from "@/utils/logger"
import { ChildCareSpace } from "@/models"
import { ChildCareSpacePolicy } from "@/policies"
import { UpdateService } from "@/services/child-care-spaces"
import { IndexSerializer, ShowSerializer } from "@/serializers/child-care-spaces"
import BaseController from "@/controllers/base-controller"

export class ChildCareSpacesController extends BaseController<ChildCareSpace> {
  async index() {
    try {
      const where = this.buildWhere()
      const scopes = this.buildFilterScopes()
      const order = this.buildOrder([["fundingSubmissionLineId", "ASC"]])
      const scopedChildCareSpaces = ChildCareSpacePolicy.applyScope(scopes, this.currentUser)

      const totalCount = await scopedChildCareSpaces.count({ where })
      const childCareSpaces = await scopedChildCareSpaces.findAll({
        where,
        order,
        limit: this.pagination.limit,
        offset: this.pagination.offset,
      })
      const serializedChildCareSpaces = IndexSerializer.perform(childCareSpaces, this.currentUser)
      return this.response.json({
        childCareSpaces: serializedChildCareSpaces,
        totalCount,
      })
    } catch (error) {
      logger.error(`Error fetching Child Care Spaces: ${error}`, { error })
      return this.response.status(400).json({
        message: `Error fetching Child Care Spaces: ${error}`,
      })
    }
  }

  async show() {
    try {
      const childCareSpace = await this.loadChildCareSpace()
      if (isNil(childCareSpace)) {
        return this.response.status(404).json({
          message: "Child Care Space not found",
        })
      }

      const policy = this.buildPolicy(childCareSpace)
      if (!policy.show()) {
        return this.response.status(403).json({
          message: "You are not authorized to view this Child Care Space",
        })
      }

      const serializedChildCareSpace = ShowSerializer.perform(childCareSpace)
      return this.response.json({
        childCareSpace: serializedChildCareSpace,
        policy,
      })
    } catch (error) {
      logger.error(`Error fetching Child Care Space: ${error}`, { error })
      return this.response.status(400).json({
        message: `Error fetching Child Care Space: ${error}`,
      })
    }
  }

  async update() {
    try {
      const childCareSpace = await this.loadChildCareSpace()
      if (isNil(childCareSpace)) {
        return this.response.status(404).json({
          message: "Child Care Space not found",
        })
      }

      const policy = this.buildPolicy(childCareSpace)
      if (!policy.update()) {
        return this.response.status(403).json({
          message: "You are not authorized to update this Child Care Space",
        })
      }

      const permittedAttributes = policy.permitAttributes(this.request.body)
      const updatedChildCareSpace = await UpdateService.perform(childCareSpace, permittedAttributes)
      const serializedChildCareSpace = ShowSerializer.perform(updatedChildCareSpace)
      return this.response.json({
        childCareSpace: serializedChildCareSpace,
        policy,
      })
    } catch (error) {
      logger.error(`Error updating Child Care Space: ${error}`, { error })
      return this.response.status(422).json({
        message: `Error updating Child Care Space: ${error}`,
      })
    }
  }

  private loadChildCareSpace() {
    return ChildCareSpace.findByPk(this.params.childCareSpaceId)
  }

  private buildPolicy(childCareSpace: ChildCareSpace = ChildCareSpace.build()) {
    return new ChildCareSpacePolicy(this.currentUser, childCareSpace)
  }
}

export default ChildCareSpacesController
