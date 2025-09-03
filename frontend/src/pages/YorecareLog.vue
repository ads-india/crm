<template>
  <LayoutHeader v-if="log.doc">
    <template #left-header>
      <Breadcrumbs :items="breadcrumbs">
        <template #prefix="{ item }">
          <Icon v-if="item.icon" :icon="item.icon" class="mr-2 h-4" />
        </template>
      </Breadcrumbs>
    </template>
  </LayoutHeader>
  <div v-if="log.doc" ref="parentRef" class="flex h-full">
    <Resizer
      v-if="log.doc"
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
                :label="log.doc.user_name || log.doc.name"
                :image="log.doc.image"
              />
            </div>
          </div>
          <div class="flex gap-1.5">
            <Button
              v-if="callEnabled && log.doc.mobile_no"
              :label="__('Make Call')"
              size="sm"
              @click="callEnabled && makeCall(log.doc.mobile_no)"
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
              @click="deleteLog()"
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
          doctype="Yorecare Log"
          :docname="log.doc.name"
          @reload="sections.reload"
        />
      </div>
    </Resizer>
  </div>
  <ErrorPage
    v-else-if="errorTitle"
    :errorTitle="errorTitle"
    :errorMessage="errorMessage"
  />
  <DeleteLinkedDocModal
    v-if="showDeleteLinkedDocModal"
    v-model="showDeleteLinkedDocModal"
    :doctype="'Yorecare Log'"
    :docname="log.doc.name"
    name="Yorecare Logs"
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
const { doctypeMeta } = getMeta('Yorecare Log')

const props = defineProps({
  yorecareLogId: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const router = useRouter()

const errorTitle = ref('')
const errorMessage = ref('')

const { document: log } = useDocument('Yorecare Log', props.yorecareLogId)

const breadcrumbs = computed(() => {
  let items = [{ label: __('Yorecare Logs'), route: { name: 'Yorecare Logs' } }]

  if (route.query.view || route.query.viewType) {
    let view = getView(route.query.view, route.query.viewType, 'Yorecare Log')
    if (view) {
      items.push({
        label: __(view.label),
        icon: view.icon,
        route: {
          name: 'Yorecare Logs',
          params: { viewType: route.query.viewType },
          query: { view: route.query.view },
        },
      })
    }
  }

  items.push({
    label: title.value,
    route: { name: 'Yorecare Log', params: { yorecareLogId: props.yorecareLogId } },
  })
  return items
})

const title = computed(() => {
  let t = doctypeMeta['Yorecare Log']?.title_field || 'name'
  return log.doc?.[t] || props.yorecareLogId
})

usePageMeta(() => {
  return {
    title: title.value,
    icon: brand.favicon,
  }
})

const showDeleteLinkedDocModal = ref(false)

async function deleteLog() {
  showDeleteLinkedDocModal.value = true
}

const sections = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections',
  cache: ['sidePanelSections', 'Yorecare Log'],
  params: { doctype: 'Yorecare Log' },
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
</script>