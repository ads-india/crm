<template>
  <Dialog v-model="show" :options="{ size: '3xl' }">
    <template #body>
      <div class="bg-surface-modal px-4 pb-6 pt-5 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">
              {{ __('Create Yorecare Enquiry') }}
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
          <FieldLayout v-if="tabs.data" :tabs="tabs.data" :data="enquiry.doc" />
          <ErrorMessage class="mt-4" v-if="error" :message="__(error)" />
        </div>
      </div>
      <div class="px-4 pb-7 pt-4 sm:px-6">
        <div class="flex flex-row-reverse gap-2">
          <Button
            variant="solid"
            :label="__('Create')"
            :loading="isEnquiryCreating"
            @click="createNewEnquiry"
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
const isEnquiryCreating = ref(false)

const { document: enquiry, triggerOnBeforeCreate } = useDocument('Yorecare Enquiry')

const enquiryStatuses = computed(() => {
  return [
    { label: 'New', value: 'New' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ]
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
              field.options = enquiryStatuses.value
            }

            if (field.fieldname == 'type') {
              field.fieldtype = 'Select'
              field.options = [
                { label: 'Medicine Order', value: 'Medicine Order' },
                { label: 'General Enquiry', value: 'General Enquiry' },
                { label: 'Consultation', value: 'Consultation' },
              ]
            }

            if (field.fieldtype === 'Table') {
              enquiry.doc[field.fieldname] = []
            }
          })
        })
      })
    })
  },
})

const createEnquiry = createResource({
  url: 'frappe.client.insert',
})

async function createNewEnquiry() {
  await triggerOnBeforeCreate?.()

  createEnquiry.submit(
    {
      doc: {
        doctype: 'Yorecare Enquiry',
        ...enquiry.doc,
      },
    },
    {
      validate() {
        error.value = null
        if (!enquiry.doc.phone_number) {
          error.value = __('Phone Number is mandatory')
          return error.value
        }
        if (
          enquiry.doc.phone_number &&
          isNaN(enquiry.doc.phone_number.replace(/[-+() ]/g, ''))
        ) {
          error.value = __('Phone Number should be a valid number')
          return error.value
        }
        if (!enquiry.doc.type) {
          error.value = __('Type is required')
          return error.value
        }
        isEnquiryCreating.value = true
      },
      onSuccess(data) {
        capture('enquiry_created')
        isEnquiryCreating.value = false
        show.value = false
        
        // Route to appropriate view based on type
        if (enquiry.doc.type === 'Medicine Order') {
          router.push({ name: 'Medicine Order', params: { medicineOrderId: data.name } })
        } else if (enquiry.doc.type === 'Lab Test')  {
          router.push({ name: 'Lab Test', params: { labTestId: data.name } })
        } else if (enquiry.doc.type === 'Contact Expert Request')  {
          router.push({ name: 'Contact Expert Request', params: { contactExpertRequestId: data.name } })
        }
        
        updateOnboardingStep('create_first_enquiry', true, false, () => {
          localStorage.setItem('firstEnquiry' + user, data.name)
        })
      },
      onError(err) {
        isEnquiryCreating.value = false
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
  // Initialize with default values
  enquiry.doc = { 
    source: 'Manual',
    medicine_order_status: 'New'
  }
  
  // Apply any passed defaults
  Object.assign(enquiry.doc, props.defaults)
  
  // Set type default only if not provided
  if (!enquiry.doc.type) {
    enquiry.doc.type = 'Medicine Order'
  }
  
  // Set status default only if not provided
  if (!enquiry.doc.medicine_order_status && enquiryStatuses.value[0]?.value) {
    enquiry.doc.medicine_order_status = enquiryStatuses.value[0].value
  }
})
</script>