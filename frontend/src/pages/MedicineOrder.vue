<template>
  <LayoutHeader v-if="medicineOrder.doc">
    <template #left-header>
      <Breadcrumbs :items="breadcrumbs">
        <template #prefix="{ item }">
          <Icon v-if="item.icon" :icon="item.icon" class="mr-2 h-4" />
        </template>
      </Breadcrumbs>
    </template>
  </LayoutHeader>
  <div v-if="medicineOrder.doc" ref="parentRef" class="flex h-full">
    <Resizer
      v-if="medicineOrder.doc"
      :parent="$refs.parentRef"
      class="flex h-full flex-col overflow-hidden border-r"
    >
      <div class="border-b">
        <div class="flex flex-col items-start justify-start gap-4 p-5">
          <div class="flex gap-4 items-center">
            <div class="group relative h-15.5 w-15.5">
              <Avatar
                size="3xl"
                class="h-15.5 w-15.5"
                :label="medicineOrder.doc.customer_name || medicineOrder.doc.name"
                :image="medicineOrder.doc.image"
              />
            </div>
            <div class="flex flex-col gap-2 truncate text-ink-gray-9">
              <div class="truncate text-2xl font-medium">
                <span>{{ medicineOrder.doc.customer_name || medicineOrder.doc.name }}</span>
              </div>
              <div
                v-if="medicineOrder.doc.mobile_no"
                class="flex items-center gap-1.5 text-base text-ink-gray-8"
              >
                <PhoneIcon class="h-4 w-4" />
                <span>{{ medicineOrder.doc.mobile_no }}</span>
              </div>
              <div
                v-if="medicineOrder.doc.email"
                class="flex items-center gap-1.5 text-base text-ink-gray-8"
              >
                <EmailIcon class="h-4 w-4" />
                <span>{{ medicineOrder.doc.email }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-1.5">
            <Button
              v-if="callEnabled && medicineOrder.doc.mobile_no"
              :label="__('Make Call')"
              size="sm"
              @click="callEnabled && makeCall(medicineOrder.doc.mobile_no)"
            >
              <template #prefix>
                <PhoneIcon class="h-4 w-4" />
              </template>
            </Button>
            <Button
              :label="__('Delete')"
              theme="red"
              size="sm"
              icon-left="trash-2"
              @click="deleteMedicineOrder()"
            />
          </div>
        </div>
      </div>
      <div
        v-if="sections.data"
        class="flex flex-1 flex-col justify-between overflow-hidden"
      >
        <SidePanelLayout
          :sections="sections.data"
          doctype="Yorecare Enquiry"
          :docname="medicineOrder.doc.name"
          @reload="sections.reload"
        />
      </div>
    </Resizer>
    <Tabs as="div" v-model="tabIndex" :tabs="tabs">
      <template #tab-item="{ tab, selected }">
        <button
          class="group flex items-center gap-2 border-b border-transparent py-2.5 text-base text-ink-gray-5 duration-300 ease-in-out hover:border-outline-gray-3 hover:text-ink-gray-9"
          :class="{ 'text-ink-gray-9': selected }"
        >
          <component v-if="tab.icon" :is="tab.icon" class="h-5" />
          {{ __(tab.label) }}
          <Badge
            class="group-hover:bg-surface-gray-7"
            :class="[selected ? 'bg-surface-gray-7' : 'bg-gray-600']"
            variant="solid"
            theme="gray"
            size="sm"
          >
            {{ tab.count }}
          </Badge>
        </button>
      </template>
      <template #tab-panel="{ tab }">
        <LeadsListView
          v-if="tab.label === 'Leads' && rows.length"
          class="mt-4"
          :rows="rows"
          :columns="columns"
          :options="{ selectable: false, showTooltip: false }"
        />
        <div
          v-if="!rows.length"
          class="grid flex-1 place-items-center text-xl font-medium text-ink-gray-4"
        >
          <div class="flex flex-col items-center justify-center space-y-3">

            <component :is="tab.icon" class="!h-10 !w-10" />
            <div>{{ __('No {0} Found', [__(tab.label)]) }}</div>
          </div>
        </div>
      </template>
    </Tabs>
  </div>
  <ErrorPage
    v-else-if="errorTitle"
    :errorTitle="errorTitle"
    :errorMessage="errorMessage"
  />
  <DeleteLinkedDocModal
    v-if="showDeleteLinkedDocModal"
    v-model="showDeleteLinkedDocModal"
    :doctype="'Yorecare Enquiry'"
    :docname="medicineOrder.doc.name"
    name="Medicine Orders"
  />
</template>

<script setup>
import ErrorPage from '@/components/ErrorPage.vue'
import Resizer from '@/components/Resizer.vue'
import Icon from '@/components/Icon.vue'
import SidePanelLayout from '@/components/SidePanelLayout.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import EmailIcon from '@/components/Icons/EmailIcon.vue'
import LeadsIcon from '@/components/Icons/LeadsIcon.vue'
import LeadsListView from '@/components/ListViews/LeadsListView.vue'
import DeleteLinkedDocModal from '@/components/DeleteLinkedDocModal.vue'
import { formatDate, timeAgo } from '@/utils'
import { getView } from '@/utils/view'
import { useDocument } from '@/data/document'
import { getSettings } from '@/stores/settings'
import { getMeta } from '@/stores/meta'
import { globalStore } from '@/stores/global.js'
import { usersStore } from '@/stores/users.js'
import { statusesStore } from '@/stores/statuses'
import { callEnabled } from '@/composables/settings'
import {
  Breadcrumbs,
  Avatar,
  Tabs,
  call,
  createResource,
  usePageMeta,
  toast,
} from 'frappe-ui'
import { ref, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { brand } = getSettings()
const { makeCall } = globalStore()

const { getUser } = usersStore()
const { getLeadStatus } = statusesStore()
const { doctypeMeta } = getMeta('Yorecare Enquiry')

const props = defineProps({
  medicineOrderId: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const router = useRouter()

const errorTitle = ref('')
const errorMessage = ref('')

const { document: medicineOrder } = useDocument('Yorecare Enquiry', props.medicineOrderId)

const breadcrumbs = computed(() => {
  let items = [{ label: __('Medicine Orders'), route: { name: 'Medicine Orders' } }]

  if (route.query.view || route.query.viewType) {
    let view = getView(route.query.view, route.query.viewType, 'Yorecare Enquiry')
    if (view) {
      items.push({
        label: __(view.label),
        icon: view.icon,
        route: {
          name: 'Medicine Orders',
          params: { viewType: route.query.viewType },
          query: { view: route.query.view },
        },
      })
    }
  }

  items.push({
    label: title.value,
    route: { name: 'Medicine Order', params: { medicineOrderId: props.medicineOrderId } },
  })
  return items
})

const title = computed(() => {
  let t = doctypeMeta['Yorecare Enquiry']?.title_field || 'name'
  return medicineOrder.doc?.[t] || props.medicineOrderId
})

usePageMeta(() => {
  return {
    title: title.value,
    icon: brand.favicon,
  }
})

const showDeleteLinkedDocModal = ref(false)

async function deleteMedicineOrder() {
  showDeleteLinkedDocModal.value = true
}

const tabIndex = ref(0)
const tabs = [
  {
    label: 'Leads',
    icon: h(LeadsIcon, { class: 'h-4 w-4' }),
    count: computed(() => leads.data?.length || 0),
  },
]

const leads = createResource({
  url: 'yorecare_frappe_custom.api.get_linked_lead',
  cache: ['leads', props.medicineOrderId],
  params: {
    crm_lead: props.medicineOrderId,
  },
  auto: true,
})

const rows = computed(() => {
  if (!leads.data || leads.data.length === 0) return []

  return leads.data.map((row) => getLeadRowObject(row))
})


const sections = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections',
  cache: ['sidePanelSections', 'Yorecare Enquiry'],
  params: { doctype: 'Yorecare Enquiry' },
  auto: true,
  transform: (data) => computed(() => getParsedSections(data)),
})

function getParsedSections(_sections) {
  return _sections.map((section) => {
    section.columns = section.columns.map((column) => {
      column.fields = column.fields.map((field) => {
        return field
      })
      return column
    })
    return section
  })
}

const columns = computed(() => leadColumns)

function getLeadRowObject(lead) {
  return {
    name: lead.name,
    first_name: {
      label: lead.first_name,
    },
    mobile_no: lead.mobile_no,
    email: lead.email,
    organization: lead.organization,
    status: {
      label: lead.status,
      color: getLeadStatus(lead.status)?.color,
    },
    _isClickable: true,
    onClick: () => {
      // Navigate to the lead detail page
      router.push({ name: 'Lead', params: { leadId: lead.name } })
    },
  }
}

const leadColumns = [
  {
    label: __('ID'),
    key: 'name',
    width: '12rem',
  },
  {
    label: __('Name'),
    key: 'first_name',
    width: '10rem',
  },
  {
    label: __('Mobile No'),
    key: 'mobile_no',
    width: '12rem',
  },
]
</script>
