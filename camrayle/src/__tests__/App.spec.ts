import { describe, it, expect } from 'vitest'

import { shallowMount } from '@vue/test-utils'
import App from '../App.vue'
import ThreeScene from '../components/ThreeScene.vue'

describe('App', () => {
  it('renders the scene without page text', () => {
    const wrapper = shallowMount(App)
    expect(wrapper.findComponent(ThreeScene).exists()).toBe(true)
    expect(wrapper.text()).toBe('')
    wrapper.unmount()
  })
})
