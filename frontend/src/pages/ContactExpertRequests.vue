<template>
  <LayoutHeader>
    <template #left-header>
      <ViewBreadcrumbs v-model="viewControls" routeName="Contact Expert Requests" />
    </template>
    <template #right-header>
      <CustomActions
        v-if="medicineOrderListView?.customListActions"
        :actions="medicineOrderListView.customListActions"
      />
      <Button
        variant="solid"
        :label="__('Create')"
        @click="showMedicineOrderModal = true"
      >
        <template #prefix><FeatherIcon name="plus" class="h-4" /></template>
      </Button>
    </template>
  </LayoutHeader>
  <ViewControls
    ref="viewControls"
    v-model="medicineOrders"
    v-model:loadMore="loadMore"
    v-model:resizeColumn="triggerResize"
    v-model:updatedPageCount="updatedPageCount"
    doctype="Yorecare Enquiry"
    :filters="{ type: 'Contact Expert Request' }"
    :options="{
      allowedViews: ['list', 'group_by', 'kanban'],
    }"
  />
  <KanbanView
    v-if="route.params.viewType == 'kanban'"
    v-model="medicineOrders"
    :options="{
      getRoute: (row) => ({
        name: 'Contact Expert Requests',
        params: { medicineOrderId: row.name },
        query: { view: route.query.view, viewType: route.params.viewType },
      }),
      onNewClick: (column) => onNewClick(column),
    }"
    @update="(data) => viewControls.updateKanbanSettings(data)"
    @loadMore="(columnName) => viewControls.loadMoreKanban(columnName)"
  >
    <template #title="{ titleField, itemName }">
      <div class="flex items-center gap-2">
        <div v-if="titleField === 'medicine_order_status'">
          <IndicatorIcon :class="getRow(itemName, titleField).color" />
        </div>
        <div v-else-if="titleField === 'phone_number'">
          <PhoneIcon class="h-4 w-4" />
        </div>
        <div v-else-if="titleField === 'crm_lead'">
          <Avatar
            v-if="getRow(itemName, titleField).label"
            class="flex items-center"
            :label="getRow(itemName, titleField).label"
            size="sm"
          />
        </div>
        <div
          v-if="
            [
              'modified',
              'creation',
            ].includes(titleField)
          "
          class="truncate text-base"
        >
          <Tooltip :text="getRow(itemName, titleField).label">
            <div>{{ getRow(itemName, titleField).timeAgo }}</div>
          </Tooltip>
        </div>
        <div
          v-else-if="getRow(itemName, titleField).label"
          class="truncate text-base"
        >
          {{ getRow(itemName, titleField).label }}
        </div>
        <div class="text-ink-gray-4" v-else>{{ __('No Title') }}</div>
      </div>
    </template>
    <template #fields="{ fieldName, itemName }">
      <div
        v-if="getRow(itemName, fieldName).label"
        class="truncate flex items-center gap-2"
      >
        <div v-if="fieldName === 'medicine_order_status'">
          <IndicatorIcon :class="getRow(itemName, fieldName).color" />
        </div>
        <div v-else-if="fieldName === 'phone_number'">
          <PhoneIcon class="h-4 w-4" />
        </div>
        <div v-else-if="fieldName === 'crm_lead'">
          <Avatar
            v-if="getRow(itemName, fieldName).label"
            class="flex items-center"
            :label="getRow(itemName, fieldName).label"
            size="xs"
          />
        </div>
        <div
          v-if="
            [
              'modified',
              'creation',
            ].includes(fieldName)
          "
          class="truncate text-base"
        >
          <Tooltip :text="getRow(itemName, fieldName).label">
            <div>{{ getRow(itemName, fieldName).timeAgo }}</div>
          </Tooltip>
        </div>
        <div v-else class="truncate text-base">
          {{ getRow(itemName, fieldName).label }}
        </div>
      </div>
    </template>
    <template #actions="{ itemName }">
      <div class="flex gap-2 items-center justify-between">
        <div class="text-ink-gray-5 flex items-center gap-1.5">
          <EmailAtIcon class="h-4 w-4" />
          <span v-if="getRow(itemName, '_email_count').label">
            {{ getRow(itemName, '_email_count').label }}
          </span>
          <span class="text-3xl leading-[0]"> &middot; </span>
          <NoteIcon class="h-4 w-4" />
          <span v-if="getRow(itemName, '_note_count').label">
            {{ getRow(itemName, '_note_count').label }}
          </span>
          <span class="text-3xl leading-[0]"> &middot; </span>
          <TaskIcon class="h-4 w-4" />
          <span v-if="getRow(itemName, '_task_count').label">
            {{ getRow(itemName, '_task_count').label }}
          </span>
          <span class="text-3xl leading-[0]"> &middot; </span>
          <CommentIcon class="h-4 w-4" />
          <span v-if="getRow(itemName, '_comment_count').label">
            {{ getRow(itemName, '_comment_count').label }}
          </span>
        </div>
        <Dropdown
          class="flex items-center gap-2"
          :options="actions(itemName)"
          variant="ghost"
          @click.stop.prevent
        >
          <Button icon="plus" variant="ghost" />
        </Dropdown>
      </div>
    </template>
  </KanbanView>
  <MedicineOrderListView
    ref="medicineOrderListView"
    v-else-if="medicineOrders.data && rows.length"
    v-model="medicineOrders.data.page_length_count"
    v-model:list="medicineOrders"
    :rows="rows"
    :columns="medicineOrders.data.columns"
    :options="{
      showTooltip: false,
      resizeColumn: true,
      rowCount: medicineOrders.data.row_count,
      totalCount: medicineOrders.data.total_count,
    }"
    @loadMore="() => loadMore++"
    @columnWidthUpdated="() => triggerResize++"
    @updatePageCount="(count) => (updatedPageCount = count)"
    @applyFilter="(data) => viewControls.applyFilter(data)"
    @applyLikeFilter="(data) => viewControls.applyLikeFilter(data)"
    @likeDoc="(data) => viewControls.likeDoc(data)"
    @selectionsChanged="
      (selections) => viewControls.updateSelections(selections)
    "
  />
  <div v-else-if="medicineOrders.data" class="flex h-full items-center justify-center">
    <div
      class="flex flex-col items-center gap-3 text-xl font-medium text-ink-gray-4"
    >
      <LeadsIcon class="h-10 w-10" />
      <span>{{ __('No {0} Found', [__('Contact Expert Requests')]) }}</span>
      <Button :label="__('Create')" @click="showMedicineOrderModal = true">
        <template #prefix><FeatherIcon name="plus" class="h-4" /></template>
      </Button>
    </div>
  </div>
  <MedicineOrderModal
    v-if="showMedicineOrderModal"
    v-model="showMedicineOrderModal"
    :defaults="defaults"
  />
  <NoteModal
    v-if="showNoteModal"
    v-model="showNoteModal"
    :note="note"
    doctype="Yorecare Enquiry"
    :doc="docname"
  />
  <TaskModal
    v-if="showTaskModal"
    v-model="showTaskModal"
    :task="task"
    doctype="Yorecare Enquiry"
    :doc="docname"
  />
</template>

<script setup>
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import MultipleAvatar from '@/components/MultipleAvatar.vue'
import CustomActions from '@/components/CustomActions.vue'
import EmailAtIcon from '@/components/Icons/EmailAtIcon.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import NoteIcon from '@/components/Icons/NoteIcon.vue'
import TaskIcon from '@/components/Icons/TaskIcon.vue'
import CommentIcon from '@/components/Icons/CommentIcon.vue'
import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import LeadsIcon from '@/components/Icons/LeadsIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import MedicineOrderListView from '@/components/ListViews/MedicineOrderListView.vue'
import KanbanView from '@/components/Kanban/KanbanView.vue'
import MedicineOrderModal from '@/components/Modals/MedicineOrderModal.vue'
import NoteModal from '@/components/Modals/NoteModal.vue'
import TaskModal from '@/components/Modals/TaskModal.vue'
import ViewControls from '@/components/ViewControls.vue'
import { getMeta } from '@/stores/meta'
import { globalStore } from '@/stores/global'
import { usersStore } from '@/stores/users'
import { statusesStore } from '@/stores/statuses'
import { callEnabled } from '@/composables/settings'
import { formatDate, timeAgo, website, formatTime } from '@/utils'
import { Avatar, Tooltip, Dropdown } from 'frappe-ui'
import { useRoute } from 'vue-router'
import { ref, computed, reactive, h } from 'vue'

const { getFormattedPercent, getFormattedFloat, getFormattedCurrency } =
  getMeta('Yorecare Enquiry')
const { makeCall } = globalStore()
const { getUser } = usersStore()
const { getLeadStatus } = statusesStore()

const route = useRoute()

const medicineOrderListView = ref(null)
const showMedicineOrderModal = ref(false)

const defaults = reactive({})

// medicine orders data is loaded in the ViewControls component
const medicineOrders = ref({})
const loadMore = ref(1)
const triggerResize = ref(1)
const updatedPageCount = ref(20)
const viewControls = ref(null)

function getRow(name, field) {
  function getValue(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value
    }
    return { label: value }
  }
  return getValue(rows.value?.find((row) => row.name == name)[field])
}

// Rows
const rows = computed(() => {
  if (!medicineOrders.value?.data?.data) return []
  if (medicineOrders.value.data.view_type === 'group_by') {
    if (!medicineOrders.value?.data.group_by_field?.fieldname) return []
    return getGroupedByRows(
      medicineOrders.value?.data.data,
      medicineOrders.value?.data.group_by_field,
      medicineOrders.value.data.columns,
    )
  } else if (medicineOrders.value.data.view_type === 'kanban') {
    return getKanbanRows(medicineOrders.value.data.data, medicineOrders.value.data.fields)
  } else {
    return parseRows(medicineOrders.value?.data.data, medicineOrders.value.data.columns)
  }
})

function getGroupedByRows(listRows, groupByField, columns) {
  let groupedRows = []

  groupByField.options?.forEach((option) => {
    let filteredRows = []

    if (!option) {
      filteredRows = listRows.filter((row) => !row[groupByField.fieldname])
    } else {
      filteredRows = listRows.filter(
        (row) => row[groupByField.fieldname] == option,
      )
    }

    let groupDetail = {
      label: groupByField.label,
      group: option || __(' '),
      collapsed: false,
      rows: parseRows(filteredRows, columns),
    }
    if (groupByField.fieldname == 'medicine_order_status') {
      groupDetail.icon = () =>
        h(IndicatorIcon, {
          class: getMedicineOrderStatusColor(option),
        })
    }
    groupedRows.push(groupDetail)
  })

  return groupedRows || listRows
}

function getKanbanRows(data, columns) {
  let _rows = []
  data.forEach((column) => {
    column.data?.forEach((row) => {
      _rows.push(row)
    })
  })
  return parseRows(_rows, columns)
}

function parseRows(rows, columns = []) {
  let view_type = medicineOrders.value.data.view_type
  let key = view_type === 'kanban' ? 'fieldname' : 'key'
  let type = view_type === 'kanban' ? 'fieldtype' : 'type'

  return rows.map((enquiry) => {
    let _rows = {}
    medicineOrders.value?.data.rows.forEach((row) => {
      _rows[row] = enquiry[row]

      let fieldType = columns?.find((col) => (col[key] || col.value) == row)?.[
        type
      ]

      if (
        fieldType &&
        ['Date', 'Datetime'].includes(fieldType) &&
        !['modified', 'creation'].includes(row)
      ) {
        _rows[row] = formatDate(enquiry[row], '', true, fieldType == 'Datetime')
      }

      if (fieldType && fieldType == 'Currency') {
        _rows[row] = getFormattedCurrency(row, enquiry)
      }

      if (fieldType && fieldType == 'Float') {
        _rows[row] = getFormattedFloat(row, enquiry)
      }

      if (fieldType && fieldType == 'Percent') {
        _rows[row] = getFormattedPercent(row, enquiry)
      }

      if (row == 'crm_lead') {
        _rows[row] = {
          label: enquiry.crm_lead,
        }
      } else if (row == 'phone_number') {
        _rows[row] = {
          label: enquiry.phone_number,
        }
      } else if (row == 'medicine_order_status') {
        _rows[row] = {
          label: enquiry.medicine_order_status,
          color: getMedicineOrderStatusColor(enquiry.medicine_order_status),
        }
      } else if (row == 'type') {
        _rows[row] = {
          label: enquiry.type,
        }
      } else if (['modified', 'creation'].includes(row)) {
        _rows[row] = {
          label: formatDate(enquiry[row]),
          timeAgo: __(timeAgo(enquiry[row])),
        }
      }
    })
    _rows['_email_count'] = enquiry._email_count || 0
    _rows['_note_count'] = enquiry._note_count || 0
    _rows['_task_count'] = enquiry._task_count || 0
    _rows['_comment_count'] = enquiry._comment_count || 0
    return _rows
  })
}

function getMedicineOrderStatusColor(status) {
  // Define colors for different medicine order statuses
  const statusColors = {
    'New': 'blue',
    'In Progress': 'orange',
    'Completed': 'green',
    'Cancelled': 'red',
    '': 'gray'
  }
  return statusColors[status] || 'gray'
}

function onNewClick(column) {
  let column_field = medicineOrders.value.params.column_field

  if (column_field) {
    defaults[column_field] = column.column.name
  }

  showMedicineOrderModal.value = true
}

function actions(itemName) {
  let phone_number = getRow(itemName, 'phone_number')?.label || ''
  let actions = [
    {
      icon: h(PhoneIcon, { class: 'h-4 w-4' }),
      label: __('Make a Call'),
      onClick: () => makeCall(phone_number),
      condition: () => phone_number && callEnabled.value,
    },
    {
      icon: h(NoteIcon, { class: 'h-4 w-4' }),
      label: __('New Note'),
      onClick: () => showNote(itemName),
    },
    {
      icon: h(TaskIcon, { class: 'h-4 w-4' }),
      label: __('New Task'),
      onClick: () => showTask(itemName),
    },
  ]
  return actions.filter((action) =>
    action.condition ? action.condition() : true,
  )
}

const docname = ref('')
const showNoteModal = ref(false)
const note = ref({
  title: '',
  content: '',
})

function showNote(name) {
  docname.value = name
  showNoteModal.value = true
}

const showTaskModal = ref(false)
const task = ref({
  title: '',
  description: '',
  assigned_to: '',
  due_date: '',
  priority: 'Low',
  status: 'Backlog',
})

function showTask(name) {
  docname.value = name
  showTaskModal.value = true
}
</script>