package com.kptv.launcher

import android.graphics.drawable.Drawable

data class AppEntry(
    val label: String,
    val packageName: String,
    val activityName: String?,
    val icon: Drawable?,
    val isPinnedToDock: Boolean = false,
    val dockPriority: Int = 99
)
