import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

// Simple example component for testing
const ExampleComponent = defineComponent({
  props: {
    msg: {
      type: String,
      default: ''
    }
  },
  template: '<div>{{ msg }}</div>'
})

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should mount a Vue component', () => {
    const wrapper = mount(ExampleComponent, {
      props: {
        msg: 'Hello Vitest!'
      }
    })

    expect(wrapper.text()).toContain('Hello Vitest!')
  })
})
