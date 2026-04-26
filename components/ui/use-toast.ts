'use client'

import * as React from 'react'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
}

let count = 0
const toastTimeouts = new Map()
const listeners = []
let memoryState = { toasts: [] }

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

function addToRemoveQueue(toastId) {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((currentToast) =>
          currentToast.id === action.toast.id
            ? { ...currentToast, ...action.toast }
            : currentToast,
        ),
      }
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => addToRemoveQueue(toast.id))
      }

      return {
        ...state,
        toasts: state.toasts.map((currentToast) =>
          currentToast.id === toastId || toastId === undefined
            ? {
                ...currentToast,
                open: false,
              }
            : currentToast,
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts:
          action.toastId === undefined
            ? []
            : state.toasts.filter((currentToast) => currentToast.id !== action.toastId),
      }
    default:
      return state
  }
}

function dispatch(action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toast(props) {
  const id = genId()

  const update = (nextProps) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...nextProps, id },
    })

  const dismiss = () =>
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId: id,
    })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss()
        }
      },
    },
  })

  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = React.useState(memoryState)

  React.useEffect(() => {
    listeners.push(setState)

    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId) =>
      dispatch({
        type: actionTypes.DISMISS_TOAST,
        toastId,
      }),
  }
}

export { reducer, toast, useToast }
