// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "src/heap/conservative-stack-visitor.h"

#include "src/execution/isolate-utils-inl.h"
#include "src/heap/large-spaces.h"
#include "src/heap/paged-spaces-inl.h"

namespace v8 {
namespace internal {

ConservativeStackVisitor::ConservativeStackVisitor(Isolate* isolate,
                                                   RootVisitor* delegate)
    : isolate_(isolate), delegate_(delegate) {}

void ConservativeStackVisitor::VisitPointer(const void* pointer) {
  VisitConservativelyIfPointer(pointer);
}

bool ConservativeStackVisitor::CheckOldSpacePage(Address address, Page* page) {
  if (address < page->area_start() || address >= page->area_end()) return false;

  HeapObject nearest_obj = HeapObject::FromAddress(
      page->object_start_bitmap()->FindNearestPrecedingObject(address));

  if (nearest_obj.address() != page->area_start()) {
    // Fast path: the OSB was precise, and |address| points somewhere inside the
    // nearest allocated object on the page.
    if (address <= nearest_obj.address() + nearest_obj.Size()) {
      VisitRoot(nearest_obj.address());
      return true;
    }
  }

  PagedSpaceObjectIterator it(isolate_->heap(), isolate_->heap()->old_space(),
                              page);
  it.AdvanceToNextPageOffset(nearest_obj.address());
  for (HeapObject obj = it.Next(); !obj.is_null(); obj = it.Next()) {
    if (obj.address() > address) {
      // |address| points to a hole of uninitialized memory in the page
      return false;
    }

    if (address < obj.address() + obj.Size()) {
      VisitRoot(obj.address());
      return true;
    }
  }
  return false;
}

void ConservativeStackVisitor::VisitConservativelyIfPointer(
    const void* pointer) {
  auto address = reinterpret_cast<Address>(pointer);
  if (address > isolate_->heap()->old_space()->top() ||
      address < isolate_->heap()->old_space()->limit()) {
    return;
  }

  for (Page* page : *isolate_->heap()->old_space()) {
    if (CheckOldSpacePage(address, page)) {
      // TODO(jakehughes) Pinning is only required for the marking visitor.
      // Other visitors (such as verify visitor) could work without pinning.
      // This should be moved to delegate_
      page->SetFlag(BasicMemoryChunk::Flag::PINNED);
      return;
    }
  }

  for (LargePage* page : *isolate_->heap()->lo_space()) {
    if (address >= page->area_start() && address < page->area_end()) {
      VisitRoot(page->area_start());
      return;
    }
  }
}

void ConservativeStackVisitor::VisitRoot(Address address) {
  Object obj = HeapObject::FromAddress(address);
  FullObjectSlot root = FullObjectSlot(&obj);
  delegate_->VisitRootPointer(Root::kHandleScope, nullptr, root);
  DCHECK(root == FullObjectSlot(reinterpret_cast<Address>(&address)));
}

}  // namespace internal
}  // namespace v8
