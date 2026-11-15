'use client'

import * as React from 'react'

type ToastAction = React.ReactNode

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastAction
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  open?: boolean
}

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | { type: ActionType['ADD_TOAST']; toast: ToasterToast }
  | { type: ActionType['UPDATE_TOAST']; toast: Partial<ToasterToast> }
  | { type: ActionType['DISMISS_TOAST']; toastId?: string }
  | { type: ActionType['REMOVE_TOAST']; toastId?: string }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const removeToastTimeout = (toastId: string) => {
  clearTimeout(toastTimeouts.get(toastId))
}

const addToastTimeout = (
  toastId: string,
  callback: () => void,
  delay: number
) => {
  removeToastTimeout(toastId)
  const timeout = setTimeout(callback, delay)
  toastTimeouts.set(toastId, timeout)
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action
      if (toastId) {
        addToastTimeout(toastId, () => {
          dispatch({ type: actionTypes.REMOVE_TOAST, toastId })
        }, TOAST_REMOVE_DELAY)
      } else {
        state.toasts.forEach((t) => {
          addToastTimeout(t.id, () => {
            dispatch({ type: actionTypes.REMOVE_TOAST, toastId: t.id })
          }, TOAST_REMOVE_DELAY)
        })
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || !toastId
            ? { ...t, open: false }
            : t
        ),
      }
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return { ...state, toasts: [] }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }

    default:
      return state
  }
}

function listeners(
  state: State,
  action: Action,
  setState: React.Dispatch<State>
) {
  if (action.type === actionTypes.REMOVE_TOAST) {
    removeToastTimeout(action.toastId ?? '')
  }
}

let state: State = { toasts: [] }

function dispatch(action: Action) {
  state = reducer(state, action)
  listeners(state, action, setState)
}

type ToastContent = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastAction
  variant?: ToastProps['variant']
}

function toast({ ...props }: ToastContent) {
  const id = genId()
  const update = (newProps: Partial<ToasterToast>) =>
    dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...newProps, id } })
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(state)

  React.useEffect(() => {
    listeners(state, { type: 'INIT' as any, toast: undefined }, setState)
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

export { useToast, toast }

export type { ToastProps, ToasterToast }
