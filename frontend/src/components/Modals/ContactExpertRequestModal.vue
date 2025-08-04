<template>
  <Dialog v-model="show" :options="{ size: '3xl' }">
    <template #body>
      <div class="bg-surface-modal px-4 pb-6 pt-5 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">
              {{ __('Create Contact Expert Request') }}
            </h3>
          </div>
          <div class="flex items-center gap-1">
            <Button
              v-if="isManager() && !isMobileView"
              variant="ghost"
              class="w-7"
              @click="openQuickEntryModal"
            >
              <template #icon>
                <EditIcon />
              </template>
            </Button>
            <Button variant="ghost" class="w-7" @click="show = false">
              <template #icon>
                <FeatherIcon name="x" class="size-4" />
              </template>
            </Button>
          </div>
        </div>
        <div>
          <FieldLayout v-if="tabs.data" :tabs="tabs.data" :data="medicineOrder.doc" />
          <ErrorMessage class="mt-4" v-if="error" :message="__(error)" />
        </div>
      </div>
      <div class="px-4 pb-7 pt-4 sm:px-6">
        <div class="flex flex-row-reverse gap-2">
          <Button
            variant="solid"
            :label="__('Create')"
            :loading="isMedicineOrderCreating"
            @click="createNewMedicineOrder"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import EditIcon from '@/components/Icons/EditIcon.vue'
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import { usersStore } from '@/stores/users'
import { sessionStore } from '@/stores/session'
import { isMobileView } from '@/composables/settings'
import { showQuickEntryModal, quickEntryProps } from '@/composables/modals'
import { capture } from '@/telemetry'
import { createResource } from 'frappe-ui'
import { useOnboarding } from 'frappe-ui/frappe'
import { useDocument } from '@/data/document'
import { computed, onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  defaults: Object,
})

const { user } = sessionStore()
const { getUser, isManager } = usersStore()
const { updateOnboardingStep } = useOnboarding('frappecrm')

const show = defineModel()
const router = useRouter()
const error = ref(null)
const isMedicineOrderCreating = ref(false)

const { document: medicineOrder, triggerOnBeforeCreate } = useDocument('Yorecare Enquiry')

const medicineOrderStatuses = computed(() => {
  let statuses = [
    { label: 'New', value: 'New' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ]
  if (!medicineOrder.doc.medicine_order_status) {
    medicineOrder.doc.medicine_order_status = statuses?.[0]?.value
  }
  return statuses
})

const tabs = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout',
  cache: ['QuickEntry', 'Yorecare Enquiry'],
  params: { doctype: 'Yorecare Enquiry', type: 'Quick Entry' },
  auto: true,
  transform: (_tabs) => {
    return _tabs.forEach((tab) => {
      tab.sections.forEach((section) => {
        section.columns.forEach((column) => {
          column.fields.forEach((field) => {
            if (field.fieldname == 'medicine_order_status') {
              field.fieldtype = 'Select'
              field.options = medicineOrderStatuses.value
            }

            if (field.fieldname == 'type') {
              field.fieldtype = 'Select'
              field.options = [
                { label: 'Contact Expert Request', value: 'Contact Expert Request' },
                { label: 'General Enquiry', value: 'General Enquiry' },
                { label: 'Consultation', value: 'Consultation' },
              ]
            }

            if (field.fieldtype === 'Table') {
              medicineOrder.doc[field.fieldname] = []
            }
          })
        })
      })
    })
  },
})

const createMedicineOrder = createResource({
  url: 'frappe.client.insert',
})

async function createNewMedicineOrder() {
  await triggerOnBeforeCreate?.()

  createMedicineOrder.submit(
    {
      doc: {
        doctype: 'Yorecare Enquiry',
        type: 'Contact Expert Request', // Set default type
        ...medicineOrder.doc,
      },
    },
    {
      validate() {
        error.value = null
        if (!medicineOrder.doc.phone_number) {
          error.value = __('Phone Number is mandatory')
          return error.value
        }
        if (
          medicineOrder.doc.phone_number &&
          isNaN(medicineOrder.doc.phone_number.replace(/[-+() ]/g, ''))
        ) {
          error.value = __('Phone Number should be a valid number')
          return error.value
        }
        if (!medicineOrder.doc.type) {
          error.value = __('Type is required')
          return error.value
        }
        isMedicineOrderCreating.value = true
      },
      onSuccess(data) {
        capture('medicine_order_created')
        isMedicineOrderCreating.value = false
        show.value = false
        router.push({ name: 'Contact Expert Request', params: { contactExpertRequestId: data.name } })
        updateOnboardingStep('create_first_medicine_order', true, false, () => {
          localStorage.setItem('firstMedicineOrder' + user, data.name)
        })
      },
      onError(err) {
        isMedicineOrderCreating.value = false
        if (!err.messages) {
          error.value = err.message
          return
        }
        error.value = err.messages.join('\n')
      },
    },
  )
}

function openQuickEntryModal() {
  showQuickEntryModal.value = true
  quickEntryProps.value = { doctype: 'Yorecare Enquiry' }
  nextTick(() => (show.value = false))
}

onMounted(() => {
  medicineOrder.doc = { 
    type: 'Contact Expert Request',
    source: 'Manual',
    medicine_order_status: 'New'
  }
  Object.assign(medicineOrder.doc, props.defaults)

  if (!medicineOrder.doc?.medicine_order_status && medicineOrderStatuses.value[0]?.value) {
    medicineOrder.doc.medicine_order_status = medicineOrderStatuses.value[0].value
  }
})
</script>