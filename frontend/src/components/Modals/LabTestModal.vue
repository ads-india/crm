<template>
  <Dialog v-model="show" :options="{ size: '3xl' }">
    <template #body>
      <div class="bg-surface-modal px-4 pb-6 pt-5 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">
              {{ __('Create Lab Test') }}
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
          <FieldLayout v-if="tabs.data" :tabs="tabs.data" :data="labTest.doc" />
          <ErrorMessage class="mt-4" v-if="error" :message="__(error)" />
        </div>
      </div>
      <div class="px-4 pb-7 pt-4 sm:px-6">
        <div class="flex flex-row-reverse gap-2">
          <Button
            variant="solid"
            :label="__('Create')"
            :loading="isLabTestCreating"
            @click="createNewLabTest"
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
const isLabTestCreating = ref(false)

const { document: labTest, triggerOnBeforeCreate } = useDocument('Yorecare Enquiry')

const labTestStatuses = computed(() => {
  let statuses = [
    { label: 'New', value: 'New' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ]
  if (!labTest.doc.medicine_order_status) {
    labTest.doc.medicine_order_status = statuses?.[0]?.value
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
              field.options = labTestStatuses.value
            }

            if (field.fieldname == 'type') {
              field.fieldtype = 'Select'
              field.options = [
                { label: 'Lab Test', value: 'Lab Test' },
                { label: 'General Enquiry', value: 'General Enquiry' },
                { label: 'Consultation', value: 'Consultation' },
              ]
            }

            if (field.fieldtype === 'Table') {
              labTest.doc[field.fieldname] = []
            }
          })
        })
      })
    })
  },
})

const createLabTest = createResource({
  url: 'frappe.client.insert',
})

async function createNewLabTest() {
  await triggerOnBeforeCreate?.()

  createLabTest.submit(
    {
      doc: {
        doctype: 'Yorecare Enquiry',
        type: 'Lab Test', // Set default type
        ...labTest.doc,
      },
    },
    {
      validate() {
        error.value = null
        if (!labTest.doc.phone_number) {
          error.value = __('Phone Number is mandatory')
          return error.value
        }
        if (
          labTest.doc.phone_number &&
          isNaN(labTest.doc.phone_number.replace(/[-+() ]/g, ''))
        ) {
          error.value = __('Phone Number should be a valid number')
          return error.value
        }
        if (!labTest.doc.type) {
          error.value = __('Type is required')
          return error.value
        }
        isLabTestCreating.value = true
      },
      onSuccess(data) {
        capture('lab_test_created')
        isLabTestCreating.value = false
        show.value = false
        router.push({ name: 'Lab Test', params: { labTestId: data.name } })
        updateOnboardingStep('create_first_lab_test', true, false, () => {
          localStorage.setItem('firstLabTest' + user, data.name)
        })
      },
      onError(err) {
        isLabTestCreating.value = false
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
  labTest.doc = { 
    type: 'Lab Test',
    source: 'Manual',
    medicine_order_status: 'New'
  }
  Object.assign(labTest.doc, props.defaults)

  if (!labTest.doc?.medicine_order_status && labTestStatuses.value[0]?.value) {
    labTest.doc.medicine_order_status = labTestStatuses.value[0].value
  }
})
</script>