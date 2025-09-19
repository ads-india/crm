<template>
  <Dialog v-model="show" :options="{ size: '3xl' }">
    <template #body>
      <div class="bg-surface-modal px-4 pb-6 pt-5 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">
              {{ __('Create Exotel Templates Log') }}
            </h3>
          </div>
          <div class="flex items-center gap-1">
            <Button variant="ghost" class="w-7" @click="show = false">
              <template #icon>
                <FeatherIcon name="x" class="size-4" />
              </template>
            </Button>
          </div>
        </div>
        <div>
          <FieldLayout
            ref="fieldLayoutRef"
            v-if="tabs.data?.length"
            :tabs="tabs.data"
            :data="exotelTemplatesLog.doc"
            doctype="Exotel Templates Log"
          />
          <ErrorMessage class="mt-4" v-if="error" :message="__(error)" />
        </div>
      </div>
      <div class="px-4 pb-7 pt-4 sm:px-6">
        <div class="flex flex-row-reverse gap-2">
          <Button
            variant="solid"
            :label="__('Create')"
            :loading="isExotelTemplatesLogCreating"
            @click="createExotelTemplatesLog"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import { isMobileView } from '@/composables/settings'
import { useDocument } from '@/data/document'
import { Switch, createResource } from 'frappe-ui'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  defaults: Object,
})

const show = defineModel()
const router = useRouter()
const error = ref(null)

const { document: exotelTemplatesLog } = useDocument('Exotel Templates Log')

const isExotelTemplatesLogCreating = ref(false)
const fieldLayoutRef = ref(null)

const tabs = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout',
  cache: ['QuickEntry', 'Exotel Templates Log'],
  params: { doctype: 'Exotel Templates Log', type: 'Quick Entry' },
  auto: true,
  transform: (_tabs) => {
    return _tabs.forEach((tab) => {
      tab.sections.forEach((section) => {
        section.columns.forEach((column) => {
          column.fields.forEach((field) => {
            if (field.fieldtype === 'Table') {
              exotelTemplatesLog.doc[field.fieldname] = []
            }
          })
        })
      })
    })
  },
})

async function createExotelTemplatesLog() {
  isExotelTemplatesLogCreating.value = true
  
  // Add doctype to the document
  const docWithDoctype = {
    doctype: 'Exotel Templates Log',
    ...exotelTemplatesLog.doc
  }
  
  createResource({
    url: 'frappe.client.insert',
    params: {
      doc: docWithDoctype
    },
    auto: true,
    onSuccess(data) {
      isExotelTemplatesLogCreating.value = false
      show.value = false
      router.push('/crm/exotel-templates-logs/view')
    },
    onError(err) {
      isExotelTemplatesLogCreating.value = false
      if (!err.messages) {
        error.value = err.message
        return
      }
      error.value = err.messages.join('\n')
    },
  })
}

onMounted(() => {
  exotelTemplatesLog.doc = {}
  Object.assign(exotelTemplatesLog.doc, props.defaults)
})
</script>